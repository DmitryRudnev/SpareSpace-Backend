import { IsIn } from 'class-validator';
import { BookingStatus } from '../../common/enums';

export class ChangeStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}