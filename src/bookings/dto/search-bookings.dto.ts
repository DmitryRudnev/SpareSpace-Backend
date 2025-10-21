import { IsInt, IsIn, IsOptional, Min, IsPositive } from 'class-validator';
import { BookingStatus } from '../../common/enums/booking-status.enum';

export class SearchBookingsDto {
  @IsInt()
  @IsOptional()
  user_id?: number;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;
  
  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number = 10;

  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}