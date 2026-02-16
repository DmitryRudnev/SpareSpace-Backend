import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponseDto } from './notification-response.dto';

export class NotificationListResponseDto {
  @ApiProperty({ 
    type: [NotificationResponseDto], 
    description: 'Массив уведомлений' 
  })
  notifications: NotificationResponseDto[];

  @ApiProperty({ 
    type: Number, 
    description: 'Общее количество уведомлений', 
    example: 100 
  })
  total: number;

  @ApiProperty({ 
    type: Number, 
    description: 'Лимит на страницу', 
    example: 10 
  })
  limit: number;

  @ApiProperty({ 
    type: Number, 
    description: 'Смещение', 
    example: 0 
  })
  offset: number;
}
