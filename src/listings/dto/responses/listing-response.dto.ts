import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';
import { ListingType } from '../../../common/enums/listing-type.enum';
import { ListingStatus } from '../../../common/enums/listing-status.enum';

export class ListingResponseDto {
  @ApiProperty({ 
    type: Number, 
    description: 'ID объявления', 
    example: 1 
  })
  id: number;

  @ApiProperty({
    enum: ListingStatus,
    description: 'Статус объявления',
    example: ListingStatus.ACTIVE
  })
  status: ListingStatus;

  @ApiProperty({
    type: String,
    description: 'Заголовок объявления',
    example: 'Просторный паркинг в центре'
  })
  title: string;

  @ApiProperty({ 
    enum: ListingType, 
    description: 'Тип объявления', 
    example: ListingType.PARKING 
  })
  type: ListingType;

  @ApiProperty({ 
    type: Number, 
    description: 'Цена за период', 
    example: 1500 
  })
  price: number;

  @ApiProperty({ 
    enum: CurrencyType, 
    description: 'Валюта', 
    example: CurrencyType.RUB 
  })
  currency: CurrencyType;

  @ApiProperty({
    enum: ListingPeriodType,
    description: 'Период ценообразования',
    example: ListingPeriodType.DAY
  })
  pricePeriod: ListingPeriodType;

  @ApiProperty({
    type: String,
    description: 'Адрес',
    example: 'Москва, ул. Пушкина, д. Колотушкина'
  })
  address: string;

  @ApiPropertyOptional({
    type: String,
    description: 'URL первой фотографии',
    example: 'https://example.com/photo1.jpg'
  })
  firstPhotoUrl: string | null;

  @ApiProperty({ 
    type: Number, 
    description: 'Количество просмотров', 
    example: 100 
  })
  viewsCount: number;

  @ApiProperty({ 
    type: Number, 
    description: 'Количество репостов', 
    example: 10 
  })
  repostsCount: number;

  @ApiProperty({ 
    type: Number, 
    description: 'Количество добавлений в избранное', 
    example: 5 
  })
  favoritesCount: number;

  @ApiProperty({
    type: String,
    description: 'Дата создания объявления (ISO8601)',
    example: '2025-01-01T00:00:00.000Z'
  })
  createdAt: string;
}
