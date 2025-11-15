import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsISO8601, ValidateNested } from 'class-validator';

export class BookingPeriodDto {
  @ApiProperty({
    type: String,
    description: 'Дата начала бронирования (ISO8601)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsString()
  @IsISO8601({ strict: true })
  start: string;

  @ApiProperty({
    type: String,
    description: 'Дата окончания бронирования (ISO8601)',
    example: '2025-02-01T00:00:00.000Z'
  })
  @IsString()
  @IsISO8601({ strict: true })
  end: string;
}

export class UpdateBookingPeriodDto {
  @ApiProperty({
    type: BookingPeriodDto,
    description: 'Новый период бронирования'
  })
  @Type(() => BookingPeriodDto)
  @ValidateNested({ each: true })
  period: BookingPeriodDto;
}
