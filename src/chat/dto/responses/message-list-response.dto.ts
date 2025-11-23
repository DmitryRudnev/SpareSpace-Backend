import { ApiProperty } from '@nestjs/swagger';
import { MessageResponseDto } from './message-response.dto';

export class MessageListResponseDto {
  @ApiProperty({ type: [MessageResponseDto], description: 'Массив сообщений' })
  messages: MessageResponseDto[];

  @ApiProperty({ type: Number, description: 'Общее количество сообщений', example: 50 })
  total: number;

  @ApiProperty({ type: Number, description: 'Лимит', example: 10 })
  limit: number;

  @ApiProperty({ type: Number, description: 'Смещение', example: 0 })
  offset: number;
}
