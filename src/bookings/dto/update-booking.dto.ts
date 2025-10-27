import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBookingDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_date?: Date;
}
