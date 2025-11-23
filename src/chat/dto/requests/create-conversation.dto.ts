import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    type: Number,
    description: 'ID участника беседы',
    example: 2,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  participantId: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'ID объявления (опционально)',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  listingId?: number;
}
