import { IsInt, IsNumber, Min, Max, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  booking_id: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;
}
