import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsDate, Min, IsPositive, Validate, IsNotEmpty } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    type: Number,
    description: 'ID объявления',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  listingId: number;

  @ApiProperty({
    type: Date,
    description: 'Дата начала бронирования',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({
    type: Date,
    description: 'Дата окончания бронирования',
    example: '2024-01-10T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  endDate: Date;
}
