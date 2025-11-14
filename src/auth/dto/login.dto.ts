import { IsOptional, IsPhoneNumber, IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(8, 100)
  password: string;
}
