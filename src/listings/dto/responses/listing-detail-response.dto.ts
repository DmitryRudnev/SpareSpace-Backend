import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingResponseDto } from './listing-response.dto';

export class LocationDto {
  @ApiProperty({ type: Number, description: 'Долгота', example: 37.2091 })
  longitude: number;

  @ApiProperty({ type: Number, description: 'Широта', example: 55.9832 })
  latitude: number;
}

export class AvailabilityPeriodDto {
  @ApiProperty({
    type: String,
    description: 'Дата начала доступности (ISO8601)',
    example: '2025-01-01T00:00:00.000Z'
  })
  start: string;

  @ApiProperty({
    type: String,
    description: 'Дата окончания доступности (ISO8601)',
    example: '2025-02-01T00:00:00.000Z'
  })
  end: string;
}

export class ListingDetailResponseDto extends ListingResponseDto {
  @ApiPropertyOptional({ type: String, description: 'Описание объявления', example: 'Парковочное место на цокольном этаже' })
  description: string | null;

  @ApiPropertyOptional({ type: Number, description: 'Размер в квадратных метрах', example: 5.5 })
  size: number | null;

  @ApiPropertyOptional({ type: LocationDto, description: 'Координаты места' })
  location: LocationDto | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' }, description: 'Удобства в формате {"ключ": "значение"}', example: { "security": "true", "electricity": "220V" } })
  amenities: Record<string, string> | null;

  @ApiProperty({ type: AvailabilityPeriodDto, isArray: true, description: 'Периоды доступности' })
  availability: AvailabilityPeriodDto[];
} 
