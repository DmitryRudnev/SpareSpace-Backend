import { IsString, IsEnum, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';

export class CreateListingDto {
  @IsEnum(['garage', 'storage', 'parking'])
  type: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsString()
  address: string;

  @IsArray()
  @IsOptional()
  photos_json: string[];

  @IsOptional()
  amenities: any;

  @IsArray()
  @IsOptional()
  availability: string[];
}