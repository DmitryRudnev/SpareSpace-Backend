import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsArray, Min, Max, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ListingType } from '../../common/enums/listing-type.enum';
import { CurrencyType } from '../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../common/enums/listing-period-type.enum';

class AvailabilityPeriodDto {
  @IsString()
  start: string;

  @IsString()
  end: string;
}

export class CreateListingDto {
  @IsEnum(ListingType)
  type: ListingType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(ListingPeriodType)
  price_period: ListingPeriodType = ListingPeriodType.HOUR;

  @IsEnum(CurrencyType)
  currency: CurrencyType = CurrencyType.RUB;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  size: number;

  @IsOptional()
  @IsArray()
  photos_json: string[];

  @IsOptional()
  @IsObject()
  amenities: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityPeriodDto)
  availability: AvailabilityPeriodDto[];
}
