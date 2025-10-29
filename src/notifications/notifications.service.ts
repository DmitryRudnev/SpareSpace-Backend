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

  private buildSearchQuery(userId: number, searchDto: SearchNotificationsDto) {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC');

    if (searchDto.type) {
      query.andWhere('notification.type = :type', { type: searchDto.type });
    }

    if (searchDto.channel) {
      query.andWhere('notification.channel = :channel', { channel: searchDto.channel });
    }

    if (searchDto.status) {
      query.andWhere('notification.status = :status', { status: searchDto.status });
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

  async findAll(userId: number, searchDto: SearchNotificationsDto) {
    const query = this.buildSearchQuery(userId, searchDto);
    const [notifications, total] = await query.getManyAndCount();
    return {
      notifications,
      total,
      limit: searchDto.limit || 10,
      offset: searchDto.offset || 0,
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
