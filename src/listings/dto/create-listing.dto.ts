import { IsString, IsIn, IsNumber, IsOptional, IsArray, Min, Max, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AvailabilityPeriodDto {
  @IsString()
  start: string;

  @IsString()
  end: string;
}

export class CreateListingDto {
  @IsIn(['garage', 'storage', 'parking'])
  type: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsIn(['RUB', 'USD', 'USDT', 'ETH', 'TRX'])
  currency?: string;

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

  @IsNumber()
  @Min(0)
  @IsOptional()
  size: number;

  @IsArray()
  @IsOptional()
  photos_json: string[];

  @IsObject()
  @IsOptional()
  amenities: any;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityPeriodDto)
  availability: AvailabilityPeriodDto[];
}