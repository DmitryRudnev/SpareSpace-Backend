import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPublicResponseDto {
  @ApiProperty({ description: 'ID пользователя' })
  id: number;

  @ApiProperty({ description: 'Имя' })
  firstName: string;

  @ApiProperty({ description: 'Фамилия' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Отчество' })
  patronymic: string | null;

  @ApiPropertyOptional({ description: 'Рейтинг' })
  rating: number | null;

  @ApiProperty({ description: 'Верифицирован ли пользователь' })
  verified: boolean;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;
}
