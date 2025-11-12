import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingResponseDto } from './listing-response.dto';

class Point {
  @ApiProperty({ type: Number, description: 'Широта', example: 55.7558 })
  latitude: number;

  @ApiProperty({ type: Number, description: 'Долгота', example: 37.6173 })
  longitude: number;
}

class AvailabilityPeriodDto {
  @ApiProperty({
    type: String,
    description: 'Дата начала доступности (ISO8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  start: string;

  @ApiProperty({
    type: String,
    description: 'Дата окончания доступности (ISO8601)',
    example: '2024-01-10T00:00:00.000Z',
  })
  end: string;
}

export class ListingDetailResponseDto extends ListingResponseDto {
  @ApiPropertyOptional({ type: String, description: 'Описание объявления', example: 'Парковочное место на цокольном этаже' })
  description: string | null;

  @ApiPropertyOptional({ type: Number, description: 'Размер в квадратных метрах', example: 5.5 })
  size: number | null;

  @ApiPropertyOptional({ type: Point, description: 'Координаты места' })
  location: Point | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' }, description: 'Удобства', example: { 'security': 'true', 'electricity': '220V' } })
  amenities: Record<string, string> | null;

  @ApiProperty({ type: AvailabilityPeriodDto, isArray: true, description: 'Периоды доступности' })
  availability: AvailabilityPeriodDto[];
} 
