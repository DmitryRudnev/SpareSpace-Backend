import { IsIn, IsNumber, IsOptional, Min, Max, IsObject } from 'class-validator';
import { ListingType } from '../../common/enums/listing-type.enum';
import { CurrencyType } from '../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../common/enums/listing-period-type.enum';

export class SearchListingsDto {
  @IsEnum(ListingType)
  @IsOptional()
  type: ListingType;

  @IsEnum(CurrencyType)
  @IsOptional()
  currency: CurrencyType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice: number;

  @IsEnum(ListingPeriodType)
  @IsOptional()
  price_period: ListingPeriodType;

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
