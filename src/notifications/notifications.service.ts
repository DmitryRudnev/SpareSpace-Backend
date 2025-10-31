import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { SearchNotificationsDto } from './dto/search-notifications.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UsersService } from '../users/users.service';
import { NotificationStatus } from '../common/enums/notification-status.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private usersService: UsersService,
  ) {}

  private buildSearchQuery(searchDto: SearchNotificationsDto, userId: number) {
    const query = this.notificationRepository
      .createQueryBuilder('notifications')
      .where('notifications.user_id = :userId', { userId })
      .orderBy('notifications.created_at', 'DESC');

    if (searchDto.type) {
      query.andWhere('notifications.type = :type', { type: searchDto.type });
    }

    if (searchDto.channel) {
      query.andWhere('notifications.channel = :channel', { channel: searchDto.channel });
    }

    if (searchDto.status) {
      query.andWhere('notifications.status = :status', { status: searchDto.status });
    }

    if (searchDto.limit) {
      query.limit(searchDto.limit);
    }

    if (searchDto.offset) {
      query.offset(searchDto.offset);
    }

    return query;
  }

  async create(dto: CreateNotificationDto, userId?: number) {
    const targetUserId = dto.userId || userId;
    if (!targetUserId) {
      throw new UnauthorizedException('User ID is required');
    }

    await this.usersService.findById(targetUserId);

    const notification = this.notificationRepository.create({
      user_id: targetUserId,
      type: dto.type,
      content: dto.content,
      channel: dto.channel,
      is_sent: false,
      status: NotificationStatus.UNREAD,
    });

    return this.notificationRepository.save(notification);
  }

  async findAll(searchDto: SearchNotificationsDto, userId: number) {
    const query = this.buildSearchQuery(searchDto, userId);
    const [notifications, total] = await query.getManyAndCount();
    return {
      notifications,
      total,
      limit: searchDto.limit,
      offset: searchDto.offset,
    };
  }

  async findOne(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, user_id: userId },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(id: number, userId: number, dto: MarkAsReadDto) {
    const targetIds = dto.ids ? [id, ...dto.ids] : [id];

    const result = await this.notificationRepository.update(
      { id: In(targetIds), user_id: userId },
      { status: NotificationStatus.READ },
    );

    if (result.affected === 0) {
      throw new NotFoundException('No notifications found to mark as read');
    }

    return { affected: result.affected };
  }
}
