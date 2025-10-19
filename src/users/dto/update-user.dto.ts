import { IsString, IsOptional, MinLength, Matches, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone format' })
  phone?: string;

  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsBoolean()
  @IsOptional()
  two_fa_enabled?: boolean;
}