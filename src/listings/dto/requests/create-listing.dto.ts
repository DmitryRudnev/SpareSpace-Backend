import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsDate,
  Min,
  Max,
  IsObject,
  ValidateNested,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  IsUrl,
  IsISO8601,
} from 'class-validator';

import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';
import { ListingType } from '../../../common/enums/listing-type.enum';

export class LocationDto {
  @ApiProperty({ type: Number, description: 'Долгота', example: 37.2091 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ type: Number, description: 'Широта', example: 55.9832 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;
}

export class AvailabilityPeriodDto {
  @ApiProperty({
    type: String,
    description: 'Дата начала доступности (ISO8601)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsString()
  @IsISO8601({ strict: true })
  start: string;

  @ApiProperty({
    type: String,
    description: 'Дата окончания доступности (ISO8601)',
    example: '2025-02-01T00:00:00.000Z'
  })
  @IsString()
  @IsISO8601({ strict: true })
  end: string;
}

export class CreateListingDto {
  @ApiProperty({
    enum: ListingType,
    description: 'Тип объявления',
    example: ListingType.PARKING
  })
  @IsEnum(ListingType)
  type: ListingType;

  @ApiProperty({
    type: String,
    description: 'Заголовок объявления',
    minLength: 1,
    maxLength: 255,
    example: 'Просторный паркинг в центре'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Описание объявления',
    example: 'Парковочное место на цокольном этаже в жилом доме с видеонаблюдением'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiProperty({
    type: Number,
    description: 'Цена за период',
    minimum: 0,
    example: 1500
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    enum: ListingPeriodType,
    description: 'Период ценообразования',
    example: ListingPeriodType.DAY
  })
  @IsEnum(ListingPeriodType)
  pricePeriod: ListingPeriodType;

  @ApiProperty({
    enum: CurrencyType,
    description: 'Валюта',
    example: CurrencyType.RUB
  })
  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @ApiPropertyOptional({ type: LocationDto, description: 'Координаты места' })
  @IsOptional()
  @Type(() => LocationDto)
  @ValidateNested()
  location?: LocationDto;

  @ApiProperty({
    type: String,
    description: 'Физический адрес',
    example: 'Москва, ул. Пушкина, д. Колотушкина'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  address: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Размер в квадратных метрах',
    minimum: 0,
    example: 5.5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'Массив URL фотографий',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  photosJson?: string[];

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Удобства в формате {"ключ": "значение"}',
    example: { "security": "true", "electricity": "220V" }
  })
  @IsOptional()
  @IsObject()
  amenities?: Record<string, string>;

  @ApiProperty({
    type: AvailabilityPeriodDto,
    isArray: true,
    description: 'Периоды доступности'
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => AvailabilityPeriodDto)
  @ValidateNested({ each: true })
  availability: AvailabilityPeriodDto[];
}
