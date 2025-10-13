import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  full_name: string;

  @IsOptional()
  @IsEnum(['RENTER', 'LANDLORD'])
  role?: string;
}