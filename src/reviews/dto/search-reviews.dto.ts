import { IsInt, IsOptional, Min } from 'class-validator';

export class SearchReviewsDto {
  @IsInt()
  @IsOptional()
  to_user_id?: number;

  @IsInt()
  @IsOptional()
  listing_id?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number = 10;

  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}