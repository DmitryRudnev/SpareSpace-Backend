import { IsOptional, IsPhoneNumber, IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(8, 100)
  password: string;
}
