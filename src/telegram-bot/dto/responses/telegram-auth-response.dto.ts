import { ApiProperty } from '@nestjs/swagger';
import { UserPublicResponseDto } from '../../../users/dto/responses/user-public-response.dto';

export class TelegramAuthResponseDto {
  @ApiProperty({ description: 'Успешная ли авторизация', example: true })
  success: boolean;

  @ApiProperty({ description: 'Данные профиля пользователя' })
  user: UserPublicResponseDto;

  @ApiProperty({ description: 'Новый ли пользователь', example: false })
  isNewUser: boolean;

  @ApiProperty({ description: 'Сообщение для пользователя', example: 'Welcome back!' })
  message: string;
}
