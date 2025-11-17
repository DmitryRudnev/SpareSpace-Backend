import { ApiProperty } from '@nestjs/swagger';
import { ListingDetailResponseDto } from './listing-detail-response.dto';

export class ListingListResponseDto {
  @ApiProperty({ type: [ListingDetailResponseDto], description: 'Массив объявлений' })
  listings: ListingDetailResponseDto[];

  @ApiProperty({ type: Number, description: 'Общее количество объявлений', example: 100 })
  total: number;

  @ApiProperty({ type: Number, description: 'Лимит на страницу', example: 10 })
  limit: number;

  @ApiProperty({ type: Number, description: 'Смещение', example: 0 })
  offset: number;
}
