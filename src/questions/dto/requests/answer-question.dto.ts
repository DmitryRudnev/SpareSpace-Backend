import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AnswerQuestionDto {
  @ApiProperty({
    type: String,
    description: 'Текст ответа',
    example: 'Да, есть круглосуточное видеонаблюдение.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  answer: string;
}
