import { ApiProperty } from '@nestjs/swagger';
import { UserPublicResponseDto } from '../../../users/dto/responses/user-public-response.dto';

export class QuestionDetailResponseDto {
  @ApiProperty({ type: Number, description: 'ID вопроса', example: 1 })
  id: number;

  @ApiProperty({
    type: UserPublicResponseDto,
    description: 'Пользователь, задавший вопрос',
  })
  fromUser: UserPublicResponseDto;

  @ApiProperty({
    type: UserPublicResponseDto,
    description: 'Пользователь, которому адресован вопрос (владелец объявления)',
  })
  toUser: UserPublicResponseDto;

  @ApiProperty({
    type: String,
    description: 'Текст вопроса',
    example: 'Есть ли видеонаблюдение на парковке?',
  })
  text: string;

  @ApiProperty({
    type: String,
    description: 'Текст ответа',
    example: 'Да, есть круглосуточное видеонаблюдение.',
    nullable: true,
  })
  answer: string | null;

  @ApiProperty({
    type: String,
    description: 'Дата создания вопроса (ISO8601)',
    example: '2025-01-01T12:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    type: String,
    description: 'Дата ответа на вопрос (ISO8601)',
    example: '2025-01-02T14:30:00.000Z',
    nullable: true,
  })
  answeredAt: string | null;
}
