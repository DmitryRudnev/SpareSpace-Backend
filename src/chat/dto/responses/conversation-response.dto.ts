import { ApiProperty } from '@nestjs/swagger';
import { ListingResponseDto } from '../../../listings/dto/responses/listing-response.dto';
import { UserPublicResponseDto } from '../../../users/dto/responses/user-public-response.dto';

export class ConversationResponseDto {
  @ApiProperty({ description: 'ID беседы', example: 5 })
  id: number;

  @ApiProperty({ type: UserPublicResponseDto, description: 'Первый участник беседы' })
  participant1: UserPublicResponseDto;

  @ApiProperty({ type: UserPublicResponseDto, description: 'Второй участник беседы' })
  participant2: UserPublicResponseDto;

  @ApiProperty({ type: ListingResponseDto, description: 'Данные объявления' })
  listing: ListingResponseDto | null;

  @ApiProperty({ description: 'Дата последнего сообщения (ISO8601)', example: '2025-01-02T00:00:00.000Z' })
  lastMessageAt: string | null;

  @ApiProperty({ description: 'Дата создания беседы (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Дата обновления беседы (ISO8601)', example: '2025-01-02T00:00:00.000Z' })
  updatedAt: string;
}
