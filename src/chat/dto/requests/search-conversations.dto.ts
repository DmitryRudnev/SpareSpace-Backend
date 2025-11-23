import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchConversationsDto {
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
