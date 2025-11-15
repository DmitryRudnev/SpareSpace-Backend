import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BookingStatus } from '../../../common/enums/booking-status.enum';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    description: 'Статус бронирования',
    example: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
