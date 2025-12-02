import { ApiProperty } from '@nestjs/swagger';

export class GenerateTelegramLinkResponseDto {
  @ApiProperty({
    type: String,
    description: 'Ссылка для привязки Telegram аккаунта',
    example: 'https://t.me/YourBot?start=abc123...'
  })
  link: string;
}
