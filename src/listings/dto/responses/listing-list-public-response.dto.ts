import { ApiProperty } from '@nestjs/swagger';
import { ListingPublicResponseDto } from './listing-public-response.dto';

export class ListingListPublicResponseDto {
  @ApiProperty({ type: [ListingPublicResponseDto], description: 'Массив объявлений' })
  listings: ListingPublicResponseDto[];

  @ApiProperty({ type: Number, description: 'Общее количество объявлений', example: 100 })
  total: number;

  @ApiProperty({ type: Number, description: 'Лимит на страницу', example: 10 })
  limit: number;

  @ApiProperty({ type: Number, description: 'Смещение', example: 0 })
  offset: number;
} 
