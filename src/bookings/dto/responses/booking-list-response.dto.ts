import { ApiProperty } from '@nestjs/swagger';
import { BookingResponseDto } from './booking-response.dto';

export class BookingListResponseDto {
  @ApiProperty({ type: [BookingResponseDto], description: 'Массив бронирований' })
  bookings: BookingResponseDto[];

  @ApiProperty({ type: Number, description: 'Общее количество бронирований', example: 50 })
  total: number;

  @ApiProperty({ type: Number, description: 'Лимит на страницу', example: 10 })
  limit: number;

  @ApiProperty({ type: Number, description: 'Смещение', example: 0 })
  offset: number;
}
