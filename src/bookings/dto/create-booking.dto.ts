import { IsInt, IsDateString, MinDate } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  listing_id: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  @MinDate(new Date(Date.now()))
  end_date: string;
}