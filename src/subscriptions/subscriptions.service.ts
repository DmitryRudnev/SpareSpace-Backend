import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  CreateUserSubscriptionDto,
  SearchSubscriptionPlansDto,
  SearchUserSubscriptionsDto,
} from './dto';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';
import { CurrencyType } from '../common/enums/currency-type.enum';
import { UserRoleType } from '../common/enums/user-role-type.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private subscriptionRepository: Repository<UserSubscription>,
    private usersService: UsersService,
    private walletsService: WalletsService,
    private dataSource: DataSource,
  ) {}

  // Методы для планов (административные)

  private buildPlansSearchQuery(searchDto: SearchSubscriptionPlansDto) {
    const query = this.planRepository.createQueryBuilder('plan').orderBy('plan.created_at', 'DESC');

    if (searchDto.name) {
      query.andWhere('plan.name ILIKE :name', { name: `%${searchDto.name}%` });
    }

    if (searchDto.currency) {
      query.andWhere('plan.currency = :currency', { currency: searchDto.currency });
    }

    if (searchDto.limit) {
      query.limit(searchDto.limit);
    }

    if (searchDto.offset) {
      query.offset(searchDto.offset);
    }

    return query;
  }

  async findAllPlans(searchDto: SearchSubscriptionPlansDto) {
    const query = this.buildPlansSearchQuery(searchDto);
    const [plans, total] = await query.getManyAndCount();
    return { plans, total, limit: searchDto.limit, offset: searchDto.offset }
  }

  async findPlanById(id: number): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOneBy({ id });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return plan;
  }

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const existingPlan = await this.planRepository.findOneBy({ name: dto.name });
    if (existingPlan) {
      throw new ConflictException('Subscription plan with this name already exists');
    }

    const plan = this.planRepository.create(dto);
    return this.planRepository.save(plan);
  }

  async updatePlan(id: number, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findPlanById(id);
    Object.assign(plan, dto);
    return this.planRepository.save(plan);
  }

  async deletePlan(id: number): Promise<void> {
    const plan = await this.findPlanById(id);
    const activeSubscriptions = await this.subscriptionRepository.count({
      where: { plan_id: id, status: SubscriptionStatus.ACTIVE },
    });
    if (activeSubscriptions > 0) {
      throw new BadRequestException('Cannot delete plan with active subscriptions');
    }
    await this.planRepository.remove(plan);
  }

  // Методы для пользовательских подписок

  private buildUserSubscriptionsQuery(userId: number, searchDto: SearchUserSubscriptionsDto) {
    const query = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.user_id = :userId', { userId })
      .orderBy('subscription.created_at', 'DESC');

    if (searchDto.status) {
      query.andWhere('subscription.status = :status', { status: searchDto.status });
    }

    if (searchDto.limit) {
      query.limit(searchDto.limit);
    }

    if (searchDto.offset) {
      query.offset(searchDto.offset);
    }

    return query;
  }

  async findUserSubscriptions(userId: number, searchDto: SearchUserSubscriptionsDto) {
    const query = this.buildUserSubscriptionsQuery(userId, searchDto);
    const [subscriptions, total] = await query.getManyAndCount();
    return {
      subscriptions,
      total,
      limit: searchDto.limit,
      offset: searchDto.offset,
    };
  }

  async findActiveSubscription(userId: number) {
    const now = new Date();
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user_id: userId,
        status: SubscriptionStatus.ACTIVE,
        start_date: LessThanOrEqual(now),
        end_date: IsNull() || MoreThan(now),
      },
      relations: ['plan'],
    });
    return subscription || null;
  }

  async createSubscription(dto: CreateUserSubscriptionDto, userId: number) {
    const user = await this.usersService.findById(userId);

    const hasLandlordRole = await this.usersService.hasRole(userId, UserRoleType.LANDLORD);
    if (!hasLandlordRole) {
      throw new UnauthorizedException('Only landlords can purchase subscriptions');
    }

    const plan = await this.findPlanById(dto.plan_id);
    const price = plan.price;
    const currency = plan.currency;

    const activeSubscription = await this.findActiveSubscription(userId);
    if (activeSubscription) {
      throw new ConflictException('User already has an active subscription');
    }

    return this.dataSource.transaction(async (manager) => {
      const topupDto = { amount: -price, currency, method: 'SUBSCRIPTION' };
      await this.walletsService.withdraw(userId, { amount: price, currency, destination: 'subscription' });

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1); // месячная подписка; адаптировать по плану

      const subscription = manager.create(UserSubscription, {
        user_id: userId,
        plan_id: dto.plan_id,
        start_date: startDate,
        end_date,
        status: SubscriptionStatus.ACTIVE,
      });

      return manager.save(subscription);
    });
  }

  async cancelSubscription(id: number, userId: number) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, user_id: userId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Only active subscriptions can be cancelled');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.end_date = new Date();
    await this.subscriptionRepository.save(subscription);

    // Возврат средств, если надо - только в том случае, если ещё не были использованы фичи из подписки и прошло не более 1 дня
    // await this.walletsService.topup(userId, { amount: subscription.plan.price * 0.8, currency: subscription.plan.currency, method: 'REFUND' });
  }
}
