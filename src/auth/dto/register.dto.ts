import { Length, IsPhoneNumber, IsNotEmpty, IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 25)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 25)
  last_name: string;

  @IsOptional()
  @IsString()
  @Length(1, 25)
  patronymic?: string;

  @IsPhoneNumber()
  phone: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 50)
  password: string;
}
