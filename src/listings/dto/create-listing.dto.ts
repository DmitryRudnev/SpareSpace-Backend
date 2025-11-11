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
} from 'class-validator';

import { CurrencyType } from '../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../common/enums/listing-period-type.enum';
import { ListingType } from '../../common/enums/listing-type.enum';

export class AvailabilityPeriodDto {
  @ApiProperty({
    type: Date,
    description: 'Дата начала доступности',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  start: Date;

  @ApiProperty({
    type: Date,
    description: 'Дата окончания доступности',
    example: '2024-01-10T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  end: Date;
}

export class CreateListingDto {
  @ApiProperty({
    enum: ListingType,
    description: 'Тип объявления',
    example: ListingType.PARKING,
  })
  @IsEnum(ListingType)
  type: ListingType;

  @ApiProperty({
    description: 'Заголовок объявления',
    minLength: 1,
    maxLength: 255,
    example: 'Просторный паркинг в центре',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Описание объявления',
    example: 'Парковочное место на цокольном этаже в жилом доме с видеонаблюдением',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiProperty({
    description: 'Цена за период',
    minimum: 0,
    example: 1500,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    enum: ListingPeriodType,
    description: 'Период ценообразования',
    example: ListingPeriodType.DAY,
  })
  @IsEnum(ListingPeriodType)
  pricePeriod: ListingPeriodType;

  @ApiProperty({
    enum: CurrencyType,
    description: 'Валюта',
    example: CurrencyType.RUB,
  })
  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @ApiPropertyOptional({
    description: 'Широта',
    minimum: -90,
    maximum: 90,
    example: 55.7558,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Долгота',
    minimum: -180,
    maximum: 180,
    example: 37.6173,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({
    description: 'Физический адрес',
    example: 'Москва, ул. Пушкина, д. Колотушкина',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  address: string;

  @ApiPropertyOptional({
    description: 'Размер в квадратных метрах',
    minimum: 0,
    example: 5.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'Массив URL фотографий',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
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
    example: { "security": "true", "electricity": "220V" },
  })
  @IsOptional()
  @IsObject()
  amenities?: Record<string, string>;

  @ApiProperty({
    type: [AvailabilityPeriodDto],
    description: 'Периоды доступности',
    example: [{ start: '2024-01-01T00:00:00.000Z', end: '2024-01-10T00:00:00.000Z' }],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AvailabilityPeriodDto)
  availability: AvailabilityPeriodDto[];
}
