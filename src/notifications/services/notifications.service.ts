import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { SearchNotificationsDto } from '.././dto/requests/search-notifications.dto';
import { MarkAsReadDto } from '.././dto/requests/mark-as-read.dto';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../common/enums/notification-channel.enum';
import { NotificationSetting } from '../../entities/notification-setting.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationSetting)
    private notificationSettingRepository: Repository<NotificationSetting>,
  ) {}

  async create(
    userId: number, 
    type: NotificationType, 
    channel: NotificationChannel, 
    referenceId?: number, 
    payload?: any
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user: { id: userId },
      type,
      channel,
      referenceId: referenceId ?? null,
      payload: payload ?? null,
      isRead: false,
    });
    return await this.notificationRepository.save(notification);
  }


  async findAll(userId: number, dto: SearchNotificationsDto) {
    const where: any = { user: { id: userId } };
    if (dto.type) where.type = dto.type;
    if (dto.channel) where.channel = dto.channel;
    if (dto.isRead) where.isRead = dto.isRead;

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: dto.limit,
      skip: dto.offset
    });

    return {
      notifications,
      total,
      limit: dto.limit,
      offset: dto.offset,
    };
  }
  

  async findById(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }


  async markAsRead(notificationId: number, userId: number, dto: MarkAsReadDto) {
    const targetIds = dto.ids ? [notificationId, ...dto.ids] : [notificationId];
    const where: any = { 
      id: In(targetIds), 
      user: { id: userId },
      isRead: false,
    };
    const notifications = await this.notificationRepository.find({ where });

    if (notifications.length === 0) {
      throw new NotFoundException('No notifications found to mark as read');
    }

    await this.notificationRepository.update(where, { isRead: true });
  }


  async getUserNotificationSettings(userId: number): Promise<NotificationSetting> {
    let settings = await this.notificationSettingRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!settings) {
      settings = this.notificationSettingRepository.create({
        user: { id: userId },
      });
      settings = await this.notificationSettingRepository.save(settings);
    }

    return settings;
  }
}
