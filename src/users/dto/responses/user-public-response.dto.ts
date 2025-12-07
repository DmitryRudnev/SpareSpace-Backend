import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPublicResponseDto {
  @ApiProperty({ type: Number, description: 'ID пользователя', example: 1 })
  id: number;

  @ApiProperty({ type: String, description: 'Имя', example: 'Иван' })
  firstName: string;

  @ApiProperty({ type: String, description: 'Фамилия', example: 'Иванов' })
  lastName: string;

  @ApiPropertyOptional({ type: String, description: 'Отчество', example: 'Иванович' })
  patronymic: string | null;

  @ApiPropertyOptional({ type: Number, description: 'Рейтинг', example: 4.8 })
  rating: number | null;

  @ApiProperty({ type: Boolean, description: 'Верифицирован ли пользователь', example: true })
  verified: boolean;

  @ApiProperty({ type: Boolean, description: 'В сети или нет', example: true })
  isOnline: boolean;

  @ApiProperty({ type: String, description: 'Дата, когда пользователь последний раз был онлайн (ISO8601)', example: '2025-01-01T12:00:00.000Z' })
  lastSeenAt: string;

  @ApiProperty({ type: String, description: 'Дата создания (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  createdAt: string;
}
