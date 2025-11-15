import { ApiProperty } from '@nestjs/swagger';
import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { BookingStatus } from '../../../common/enums/booking-status.enum';
import { UserPublicResponseDto } from '../../../users/dto/responses/user-public-response.dto';

export class BookingResponseDto {
  @ApiProperty({ type: Number, description: 'ID бронирования', example: 1 })
  id: number;

  @ApiProperty({ type: String, description: 'Заголовок объявления', example: 'Просторный паркинг в центре' })
  listingTitle: string;

  @ApiProperty({ type: String, 
    description: 'URL первой фотографии объявления', 
    example: 'https://example.com/photo1.jpg' })
  firstListingPhoto: string | null;

  @ApiProperty({ type: UserPublicResponseDto, description: 'Арендатор' })
  renter: UserPublicResponseDto;

  @ApiProperty({ type: UserPublicResponseDto, description: 'Владелец объявления' })
  landlord: UserPublicResponseDto;

  @ApiProperty({ type: Number, description: 'Общая цена', example: 15000 })
  totalPrice: number;

  @ApiProperty({ enum: CurrencyType, description: 'Валюта', example: CurrencyType.RUB })
  currency: CurrencyType;

  @ApiProperty({ enum: BookingStatus, description: 'Статус бронирования', example: BookingStatus.PENDING })
  status: BookingStatus;

  @ApiProperty({ type: String, description: 'Дата создания (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  createdAt: string;
}
