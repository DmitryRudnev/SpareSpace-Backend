import { ApiProperty } from '@nestjs/swagger';
import { QuestionDetailResponseDto } from './question-detail-response.dto';

export class QuestionListResponseDto {
  @ApiProperty({
    type: [QuestionDetailResponseDto],
    description: 'Массив вопросов',
  })
  questions: QuestionDetailResponseDto[];

  @ApiProperty({
    type: Number,
    description: 'Общее количество вопросов',
    example: 25,
  })
  total: number;

  @ApiProperty({
    type: Number,
    description: 'Лимит на страницу',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    type: Number,
    description: 'Смещение',
    example: 0,
  })
  offset: number;
}
