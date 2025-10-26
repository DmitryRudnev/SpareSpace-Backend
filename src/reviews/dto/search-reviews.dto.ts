import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchReviewsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  to_user_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  listing_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
