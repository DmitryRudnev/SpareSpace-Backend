import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  HttpCode,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { QuestionsService } from './questions.service';
import { QuestionMapper } from './mappers/question.mapper';
import { CreateQuestionDto } from './dto/requests/create-question.dto';
import { AnswerQuestionDto } from './dto/requests/answer-question.dto';
import { QuestionListResponseDto } from './dto/responses/question-list-response.dto';
import { QuestionDetailResponseDto } from './dto/responses/question-detail-response.dto';

@ApiTags('Questions')
@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('listings/:listingId/questions')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение вопросов к объявлению',
    description:
      'Возвращает список вопросов и ответов к конкретному объявлению. Аутентификация не требуется.',
  })
  @ApiParam({
    name: 'listingId',
    description: 'ID объявления',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Лимит записей (по умолчанию 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Смещение (по умолчанию 0)',
    example: 0,
  })
  @ApiOkResponse({
    description: 'Список вопросов к объявлению',
    type: QuestionListResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  async getListingQuestions(
    @Param('listingId', ParseIntPipe) listingId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<QuestionListResponseDto> {
    const result = await this.questionsService.findByListing(
      listingId,
      limit,
      offset,
    );
    return QuestionMapper.toListResponseDto(
      result.questions,
      result.total,
      result.limit,
      result.offset,
    );
  }


  @UseGuards(JwtAuthGuard)
  @Post('questions')
  @HttpCode(201)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Создание вопроса к объявлению',
    description:
      'Создаёт вопрос от текущего пользователя к владельцу объявления. Требует аутентификации.',
  })
  @ApiBody({
    type: CreateQuestionDto,
    description: 'Данные для создания вопроса',
  })
  @ApiCreatedResponse({
    description: 'Вопрос успешно создан',
    type: QuestionDetailResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({
    description: 'Объявление или пользователь не найдены',
  })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
    @User('userId') fromUserId: number,
  ): Promise<QuestionDetailResponseDto> {
    const question = await this.questionsService.create(
      createQuestionDto,
      fromUserId,
    );
    return QuestionMapper.toDetailResponseDto(question);
  }

  
  @UseGuards(JwtAuthGuard)
  @Patch('questions/:id/answer')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Добавление или обновление ответа на вопрос',
    description:
      'Добавляет или изменяет ответ на вопрос. Может выполнять только адресат вопроса (to_user_id).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID вопроса',
    type: Number,
  })
  @ApiBody({
    type: AnswerQuestionDto,
    description: 'Текст ответа',
  })
  @ApiOkResponse({
    description: 'Ответ успешно добавлен/обновлён',
    type: QuestionDetailResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав для ответа' })
  @ApiNotFoundResponse({ description: 'Вопрос не найден' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async answer(
    @Param('id', ParseIntPipe) questionId: number,
    @Body() answerQuestionDto: AnswerQuestionDto,
    @User('userId') currentUserId: number,
  ): Promise<QuestionDetailResponseDto> {
    const question = await this.questionsService.answer(
      questionId,
      answerQuestionDto,
      currentUserId,
    );
    return QuestionMapper.toDetailResponseDto(question);
  }
}
