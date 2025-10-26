import { IsInt, IsDateString, IsDate, MinDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsInt()
  listing_id: number;

  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @Type(() => Date)
  @IsDate()
  end_date: Date;
}
