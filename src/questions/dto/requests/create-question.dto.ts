import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({
    type: Number,
    description: 'ID объявления',
    example: 1,
  })
  @IsInt()
  @Min(1)
  listingId: number;

  @ApiProperty({
    type: String,
    description: 'Текст вопроса',
    minimum: 1,
    example: 'Есть ли видеонаблюдение на парковке?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}
