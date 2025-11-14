import { ApiProperty } from '@nestjs/swagger';
import { ListingResponseDto } from './listing-response.dto';

export class ListingListResponseDto {
  @ApiProperty({ type: [ListingResponseDto], description: 'Массив объявлений' })
  listings: ListingResponseDto[];

  @ApiProperty({ type: Number, description: 'Общее количество объявлений', example: 100 })
  total: number;

  @ApiProperty({ type: Number, description: 'Лимит на страницу', example: 10 })
  limit: number;

  @ApiProperty({ type: Number, description: 'Смещение', example: 0 })
  offset: number;
}
