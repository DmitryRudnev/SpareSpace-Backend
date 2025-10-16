import { IsInt, IsIn, IsOptional, Min, IsPositive } from 'class-validator';

export class SearchBookingsDto {
  @IsInt()
  @IsOptional()
  user_id?: number;

  @IsIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number = 10;

  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}