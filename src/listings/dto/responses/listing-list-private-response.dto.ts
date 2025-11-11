import { ApiProperty } from '@nestjs/swagger';
import { ListingPrivateResponseDto } from './listing-private-response.dto';

export class ListingListPrivateResponseDto {
  @ApiProperty({ type: [ListingPrivateResponseDto], description: 'Массив объявлений' })
  listings: ListingPrivateResponseDto[];

  @ApiProperty({ type: Number, description: 'Общее количество объявлений', example: 100 })
  total: number;

  @ApiProperty({ type: Number, description: 'Лимит на страницу', example: 10 })
  limit: number;

  @ApiProperty({ type: Number, description: 'Смещение', example: 0 })
  offset: number;
} 
