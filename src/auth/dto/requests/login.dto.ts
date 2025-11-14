import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateIf, IsPhoneNumber, IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Телефон',
    example: '+78005553535'
  })
  @ValidateIf(o => !o.email)
  @IsString()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    type: String, 
    description: 'Email',
    example: 'user@example.com'
  })
  @ValidateIf(o => !o.phone)
  @IsString()
  @IsEmail()
  email?: string;

  @ApiProperty({
    type: String,
    description: 'Пароль',
    minLength: 8,
    maxLength: 100,
    example: 'qwerty123'
  })
  @IsString()
  @Length(8, 100)
  password: string;
}
