import { IsIn, IsNumber, IsOptional, Min, Max, IsObject } from 'class-validator';

export class SearchListingsDto {
  @IsIn(['garage', 'storage', 'parking'])
  @IsOptional()
  type: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  radius: number;

  @IsObject()
  @IsOptional()
  amenities: any;

  @IsNumber()
  @Min(1)
  @IsOptional()
  limit: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  offset: number;
}