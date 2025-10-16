import { IsInt, IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  booking_id: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  text?: string;
}