import { IsString, IsNotEmpty, IsNumber, IsPositive, IsBoolean, IsOptional, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyType } from '../../common/enums/currency-type.enum';

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;

  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @Type(() => Number)
  @IsNumber()
  @IsPositive({ message: 'Maximum listings must be positive' })
  max_listings: number;

  @IsBoolean()
  priority_search: boolean;

  @Type(() => Number)
  @IsNumber()
  @IsPositive({ message: 'Boosts per month must be positive' })
  boosts_per_month: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  extra_features?: Record<string, any>;
}
