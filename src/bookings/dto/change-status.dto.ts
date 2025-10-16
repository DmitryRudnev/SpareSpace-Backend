import { IsIn } from 'class-validator';

export class ChangeStatusDto {
  @IsIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status: string;
}