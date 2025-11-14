import { IsOptional, IsString, Length, IsPhoneNumber, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(1, 50)
  firstName: string;

  @IsString()
  @Length(1, 50)
  lastName: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  patronymic?: string;

  @IsPhoneNumber()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 100)
  password: string;
}
