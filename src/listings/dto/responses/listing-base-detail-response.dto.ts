import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingBaseResponseDto } from './listing-base-response.dto';

class Point {
  @ApiProperty({ type: Number, description: 'Широта', example: 55.7558 })
  latitude: number;

  @ApiProperty({ type: Number, description: 'Долгота', example: 37.6173 })
  longitude: number;
}

export class ListingBaseDetailResponseDto extends ListingBaseResponseDto {
  @ApiPropertyOptional({ type: String, description: 'Описание объявления', example: 'Парковочное место на цокольном этаже' })
  description: string | null;

  @ApiPropertyOptional({ type: Number, description: 'Размер в квадратных метрах', example: 5.5 })
  size: number | null;

  @ApiPropertyOptional({ type: Point, description: 'Координаты места' })
  location: Point | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' }, description: 'Удобства', example: { 'security': 'true', 'electricity': '220V' } })
  amenities: Record<string, string> | null;

  @ApiProperty({ type: [String], description: 'Периоды доступности', example: ['2024-01-01T00:00:00.000Z - 2024-01-10T00:00:00.000Z'] })
  availability: string[];
} 
