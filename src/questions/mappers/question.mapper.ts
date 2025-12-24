import { Question } from '../../entities/question.entity';
import { QuestionDetailResponseDto } from '../dto/responses/question-detail-response.dto';
import { QuestionListResponseDto } from '../dto/responses/question-list-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';

export class QuestionMapper {
  static toDetailResponseDto(question: Question): QuestionDetailResponseDto {
    const dto = new QuestionDetailResponseDto();

    dto.id = question.id;
    dto.fromUser = UserMapper.toPublicResponseDto(question.fromUser);
    dto.toUser = UserMapper.toPublicResponseDto(question.toUser);
    dto.text = question.text;
    dto.answer = question.answer;
    dto.createdAt = question.createdAt.toISOString();
    dto.answeredAt = question.answeredAt?.toISOString() || null;

    return dto;
  }

  static toListResponseDto(
    questions: Question[],
    total: number,
    limit: number,
    offset: number,
  ): QuestionListResponseDto {
    const dto = new QuestionListResponseDto();

    dto.questions = questions.map((question) =>
      this.toDetailResponseDto(question),
    );
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;

    return dto;
  }
}
