import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, IsPhoneNumber, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Имя',
    minLength: 1,
    maxLength: 50,
    example: 'Иван'
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Фамилия',
    minLength: 1,
    maxLength: 50,
    example: 'Иванов'
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

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

  @ApiPropertyOptional({
    type: String,
    description: 'Телефон',
    example: '+78005553535'
  })
  @IsOptional()
  @IsString()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Email',
    example: 'user@example.com'
  })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;
}
