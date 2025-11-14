import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, IsPhoneNumber, IsEmail } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    type: String,
    description: 'Имя',
    minLength: 1,
    maxLength: 50,
    example: 'Иван'
  })
  @IsString()
  @Length(1, 50)
  firstName: string;

  @ApiProperty({
    type: String,
    description: 'Фамилия', 
    minLength: 1,
    maxLength: 50,
    example: 'Иванов'
  })
  @IsString()
  @Length(1, 50)
  lastName: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Отчество',
    minLength: 1,
    maxLength: 50,
    example: 'Иванович'
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  patronymic?: string;

  @ApiProperty({
    type: String,
    description: 'Телефон',
    example: '+78005553535'
  })
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    type: String, 
    description: 'Email',
    example: 'user@example.com'
  })
  @IsString()
  @IsEmail()
  email: string;

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
