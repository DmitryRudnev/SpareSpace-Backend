import { ApiProperty } from '@nestjs/swagger';
import { ConversationResponseDto } from './conversation-response.dto';

export class ConversationsListResponseDto {
  @ApiProperty({ type: [ConversationResponseDto], description: 'Массив бесед' })
  conversations: ConversationResponseDto[];

  @ApiProperty({ type: Number, description: 'Общее количество бесед', example: 50 })
  total: number;

  @ApiProperty({ type: Number, description: 'Лимит на страницу', example: 10 })
  limit: number;

  @ApiProperty({ type: Number, description: 'Смещение', example: 0 })
  offset: number;
}
