import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UnlinkTelegramAccountRequestDto {
  @ApiProperty({
    type: Number,
    description: 'ID Telegram аккаунта для отвязки',
    example: 1,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  telegramId: number;
}
