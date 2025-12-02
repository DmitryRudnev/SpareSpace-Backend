import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TelegramAccountResponseDto {
  @ApiProperty({
    type: Number,
    description: 'ID привязанного Telegram аккаунта',
    example: 123456789,
  })
  telegramId: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Username в Telegram',
    example: 'username',
    nullable: true,
  })
  username?: string;

  @ApiProperty({
    type: String,
    description: 'Имя в Telegram',
    example: 'Pavel',
  })
  firstName: string;

  @ApiProperty({
    type: String,
    description: 'Фамилия в Telegram',
    example: 'Durov',
    nullable: true,
  })
  lastName?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Статус привязки аккаунта',
    example: true,
  })
  isLinked: boolean;
}