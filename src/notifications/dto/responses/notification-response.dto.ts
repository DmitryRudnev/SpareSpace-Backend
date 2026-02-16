import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';
import { AnyNotificationPayload } from '../../../common/interfaces/notification-payloads.interface';

export class NotificationResponseDto {
  @ApiProperty({ type: Number, description: 'ID уведомления', example: 1 })
  id: number;

  @ApiProperty({ 
    enum: NotificationType, 
    description: 'Тип события', 
    example: NotificationType.BOOKING_NEW 
  })
  type: NotificationType;

  @ApiProperty({ 
    enum: NotificationChannel, 
    description: 'Канал отправки', 
    example: NotificationChannel.FCM 
  })
  channel: NotificationChannel;

  @ApiProperty({ 
    type: Number, 
    nullable: true, 
    description: 'ID связанной сущности (брони, объявления и т.д.)', 
    example: 42 
  })
  referenceId: number | null;

  @ApiProperty({ 
    type: Object, 
    nullable: true, 
    description: 'Данные уведомления (содержание зависит от типа)',
    example: { bookingId: 1, listingTitle: 'Гараж' }
  })
  payload: AnyNotificationPayload | null;

  @ApiProperty({ type: Boolean, description: 'Статус прочтения', example: false })
  isRead: boolean;

  @ApiProperty({ 
    type: String, 
    description: 'Дата создания (ISO8601)', 
    example: '2025-01-01T00:00:00.000Z' 
  })
  createdAt: string;
}
