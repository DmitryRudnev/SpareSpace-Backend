import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpCode, 
  UseFilters
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../common/decorators/user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { DomainExceptionFilter } from '../shared/filters/domain-exception.filter';

import { ChatService } from './chat.service';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { ConversationMapper } from './mappers/conversation.mapper';
import { MessageMapper } from './mappers/message.mapper';

import { SearchMessagesDto } from './dto/requests/search-messages.dto';
import { SearchConversationsDto } from './dto/requests/search-conversations.dto';
import { CreateConversationDto } from './dto/requests/create-conversation.dto';
import { ConversationResponseDto } from './dto/responses/conversation-response.dto';
import { ConversationsListResponseDto } from './dto/responses/conversations-list-response.dto';
import { MessageListResponseDto } from './dto/responses/message-list-response.dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleType.RENTER, UserRoleType.LANDLORD)
@UseFilters(DomainExceptionFilter)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Не авторизован' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение списка бесед пользователя',
    description: 'Возвращает список бесед текущего пользователя с пагинацией. ' +
    'Требует аутентификации и роли RENTER или LANDLORD.'
  })
  @ApiQuery({
    name: 'searchDto',
    type: SearchConversationsDto,
    required: false,
    description: 'Параметры пагинации'
  })
  @ApiOkResponse({
    description: 'Список бесед пользователя',
    type: ConversationsListResponseDto
  })
  async findConversations(
    @Query() dto: SearchConversationsDto, 
    @User('userId') userId: number
  ): Promise<ConversationsListResponseDto> {
    const result = await this.chatService.findConversations(userId, dto);
    return ConversationMapper.toListResponseDto(
      result.conversations,
      result.total,
      result.limit,
      result.offset
    );
  }


  @Get('conversations/:id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение беседы по ID',
    description: 'Возвращает детали беседы по идентификатору. Требует аутентификации и участия в беседе.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID беседы', 
    type: Number,
    example: 1
  })
  @ApiOkResponse({
    description: 'Детали беседы',
    type: ConversationResponseDto
  })
  @ApiNotFoundResponse({ description: 'Беседа не найдена' })
  async findConversationById(
    @Param('id') conversationId: string,
    @User('userId') userId: number
  ): Promise<ConversationResponseDto> {
    const conversation = await this.chatService.findConversationById(+conversationId, userId);
    return ConversationMapper.toResponseDto(conversation);
  }


  @Get('conversations/:id/messages')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение сообщений беседы',
    description: 'Возвращает список сообщений в беседе с пагинацией. Требует аутентификации и участия в беседе.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID беседы', 
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'searchDto',
    type: SearchMessagesDto,
    required: false,
    description: 'Параметры пагинации'
  })
  @ApiOkResponse({
    description: 'Список сообщений беседы',
    type: MessageListResponseDto
  })
  @ApiNotFoundResponse({ description: 'Беседа не найдена' })
  async findMessages(
    @Param('id') conversationId: string,
    @Query() getMessagesDto: SearchMessagesDto,
    @User('userId') userId: number
  ): Promise<MessageListResponseDto> {
    const result = await this.chatService.findMessages(+conversationId, userId, getMessagesDto);
    return MessageMapper.toListResponseDto(
      result.messages,
      result.total,
      result.limit,
      result.offset
    );
  }


  @Post('conversations')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Создание новой беседы',
    description: 'Создает новую беседу по ID пользователей и ID объявления(опционально). ' +
    'Требует аутентификации и роли RENTER или LANDLORD.'
  })
  @ApiBody({ 
    type: CreateConversationDto, 
    description: 'Данные для создания беседы' 
  })
  @ApiCreatedResponse({
    description: 'Беседа успешно создана',
    type: ConversationResponseDto
  })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  @ApiUnauthorizedResponse({ description: 'Участники должны иметь роли RENTER или LANDLORD' })
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @User('userId') currentUserId: number
  ): Promise<ConversationResponseDto> {
    const conversation = await this.chatService.createConversation(
    currentUserId, 
    createConversationDto
    );
    return ConversationMapper.toResponseDto(conversation);
  }
}
