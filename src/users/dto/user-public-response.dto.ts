import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPublicResponseDto {
  @ApiProperty({ type: 'number', description: 'ID пользователя', example: 1 })
  id: number;

  @ApiProperty({ type: 'string', description: 'Имя', example: 'Иван' })
  firstName: string;

  @ApiProperty({ type: 'string', description: 'Фамилия', example: 'Иванов' })
  lastName: string;

  @ApiPropertyOptional({ type: 'string', description: 'Отчество', example: 'Иванович' })
  patronymic: string | null;

  @ApiPropertyOptional({ type: 'number', description: 'Рейтинг', example: 4.8 })
  rating: number | null;

  @ApiProperty({ type: 'boolean', description: 'Верифицирован ли пользователь', example: true })
  verified: boolean;

  @ApiProperty({ type: 'string', description: 'Дата создания', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}
