import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPublicResponseDto {
  @ApiProperty({ type: 'number', description: 'ID пользователя', example: 1 })
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

  @ApiProperty({ type: String, description: 'Дата создания', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}
