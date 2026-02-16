import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';

export class SearchNotificationsDto {
  @ApiPropertyOptional({
    enum: NotificationType,
    description: 'Тип уведомления',
    example: NotificationType.BOOKING_NEW
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    enum: NotificationChannel,
    description: 'Канал доставки',
    example: NotificationChannel.FCM
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Статус прочтения',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    type: Number,
    description: 'Лимит записей',
    minimum: 1,
    default: 10,
    example: 10
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({
    type: Number,
    description: 'Смещение',
    minimum: 0,
    default: 0,
    example: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number = 0;
}
