import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class TelegramAuthDto {
  @ApiProperty({ description: 'Telegram ID пользователя', example: 123456789 })
  @IsNumber()
  telegramId: number;

  @ApiProperty({ description: 'Номер телефона', example: '+78005553535' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Имя', example: 'Иван' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Фамилия', required: false, example: 'Иванов' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Username', required: false, example: 'ivan_ivanov' })
  @IsOptional()
  @IsString()
  username?: string;
}
