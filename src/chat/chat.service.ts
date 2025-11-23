import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { Repository, In, DataSource, IsNull, FindOperator } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersService } from '../users/users.service';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';

import { CreateConversationDto } from './dto/requests/create-conversation.dto';
import { SearchConversationsDto } from './dto/requests/search-conversations.dto';
import { SearchMessagesDto } from './dto/requests/search-messages.dto';

import { 
  ConversationNotFoundException, 
  ConversationAccessDeniedException,
  MessageNotFoundException
} from '../shared/exceptions/domain.exception';

interface FindConversationsResult {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

interface FindMessagesResult {
  messages: Message[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Сервис для управления беседами и сообщениями
 * @class ChatService
 */
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation) private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  // ==================== HTTP CONTROLLER METHODS ====================

  /**
   * Поиск бесед пользователя с пагинацией
   * @param userId - ID пользователя
   * @param dto - DTO с параметрами пагинации
   * @returns Объект с массивом бесед и метаданными пагинации
   */
  async findConversations(userId: number, dto: SearchConversationsDto): Promise<FindConversationsResult> {
    const [conversations, total] = await this.conversationRepository.findAndCount({
      where: [
        { participant1: { id: userId } },
        { participant2: { id: userId } }
      ],
      relations: {
        participant1: true,
        participant2: true,
        listing: { user: true }
      },
      order: { lastMessageAt: 'DESC' },
      take: dto.limit,
      skip: dto.offset
    });

    return { 
      conversations, 
      total, 
      limit: dto.limit, 
      offset: dto.offset 
    };
  }

  /**
   * Поиск беседы по ID с проверкой прав доступа
   * @param conversationId - ID беседы
   * @param userId - ID пользователя для проверки доступа
   * @returns Объект беседы
   * @throws ConversationNotFoundException если беседа не найдена
   * @throws ConversationAccessDeniedException если пользователь не участник
   */
  async findConversationById(conversationId: number, userId: number): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: {
        participant1: true,
        participant2: true,
        listing: { user: true }
      },
    });

    if (!conversation) {
      throw new ConversationNotFoundException(conversationId);
    }

    if (conversation.participant1.id != userId && conversation.participant2.id != userId) {
      throw new ConversationAccessDeniedException(conversationId, userId);
    }

    return conversation;
  }

  /**
   * Поиск сообщений в беседе с пагинацией
   * @param conversationId - ID беседы
   * @param userId - ID пользователя для проверки доступа
   * @param dto - DTO с параметрами пагинации
   * @returns Объект с массивом сообщений и метаданными пагинации
   */
  async findMessages(
    conversationId: number, 
    userId: number, 
    dto: SearchMessagesDto
  ): Promise<FindMessagesResult> {
    await this.findConversationById(conversationId, userId);

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversation: { id: conversationId } },
      relations: { 
        sender: true, 
        conversation: true 
      },
      order: { sentAt: 'ASC' },
      skip: dto.offset,
      take: dto.limit
    });

    return { 
      messages, 
      total, 
      limit: dto.limit, 
      offset: dto.offset 
    };
  }

  /**
   * Поиск сообщения по ID с проверкой прав доступа
   * @param messageId - ID сообщения
   * @param userId - ID пользователя для проверки доступа
   * @returns Объект сообщения
   * @throws MessageNotFoundException если сообщение не найдено
   * @throws ConversationAccessDeniedException если пользователь не участник беседы
   */
  async findMessageById(messageId: number, userId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: {
        sender: true,
        conversation: {
          participant1: true,
          participant2: true
        }
      },
    });

    if (!message) {
      throw new MessageNotFoundException(messageId);
    }

    const { conversation } = message;
    if (conversation.participant1.id != userId && conversation.participant2.id != userId) {
      throw new ConversationAccessDeniedException(conversation.id, userId);
    }

    return message;
  }

  /**
   * Создание новой беседы
   * @param currentUserId - ID текущего пользователя
   * @param dto - DTO с данными для создания беседы
   * @returns Созданная беседа
   * @throws BadRequestException при попытке создать беседу с собой
   * @throws ConflictException если беседа уже существует
   */
  async createConversation(
    currentUserId: number, 
    dto: CreateConversationDto
  ): Promise<Conversation> {
    const { participantId, listingId } = dto;

    if (currentUserId === participantId) {
      throw new BadRequestException('Cannot create conversation with self');
    }

    const [currentUser, targetUser] = await Promise.all([
      this.usersService.findById(currentUserId),
      this.usersService.findById(participantId)
    ]);

    const conversationExists = await this.checkConversationExists(
      currentUserId, 
      participantId, 
      listingId
    );

    if (conversationExists) {
      throw new ConflictException('Conversation already exists');
    }

    const conversation = this.conversationRepository.create({
      participant1: currentUser,
      participant2: targetUser,
      listing: listingId ? { id: listingId } : null
    });

    const savedConversation = await this.conversationRepository.save(conversation);
    return this.findConversationById(savedConversation.id, currentUserId);
  }

  // ==================== WEBSOCKET GATEWAY METHODS ====================

  /**
   * Отправка сообщения в беседу
   * @param conversationId - ID беседы
   * @param senderId - ID отправителя
   * @param text - Текст сообщения (уже валидирован через DTO)
   * @returns Созданное сообщение
   */
  async sendMessage(
    conversationId: number, 
    senderId: number, 
    text: string
  ): Promise<Message> {
    await this.findConversationById(conversationId, senderId);

    const message = this.messageRepository.create({
      conversation: { id: conversationId },
      sender: { id: senderId },
      text,
      isRead: false
    });
    const savedMessage = await this.messageRepository.save(message);
    
    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date()
    });

    return this.findMessageById(savedMessage.id, senderId);
  }

  /**
   * Пометка сообщений как прочитанных
   * @param conversationId - ID беседы
   * @param userId - ID пользователя
   * @param messageIds - Опциональный массив ID сообщений для пометки (уже валидирован через DTO)
   */
  async markMessagesAsRead(
    conversationId: number, 
    userId: number, 
    messageIds?: number[]
  ): Promise<void> {
    const conversation = await this.findConversationById(conversationId, userId);
    
    const otherParticipantId = conversation.participant1.id == userId ? 
      conversation.participant2.id : conversation.participant1.id;

    const updateCondition: any = {
      conversation: { id: conversationId },
      isRead: false,
      sender: { id: otherParticipantId }
    };

    if (messageIds && messageIds.length > 0) {
      updateCondition.id = In(messageIds);
    }

    await this.messageRepository.update(updateCondition, { 
      isRead: true,
      readAt: new Date()
    });
  }

  // ==================== SHARED PRIVATE METHODS ====================

  /**
   * Проверка существования беседы между пользователями
   * @private
   */
  private async checkConversationExists(
    user1Id: number, 
    user2Id: number, 
    listingId?: number
  ): Promise<boolean> {
    const listingCondition = listingId ? { id: listingId } : IsNull() as FindOperator<any>;

    const conditions = [
      { 
        participant1: { id: user1Id }, 
        participant2: { id: user2Id },
        listing: listingCondition
      },
      { 
        participant1: { id: user2Id }, 
        participant2: { id: user1Id },
        listing: listingCondition
      }
    ];

    const count = await this.conversationRepository.count({
      where: conditions
    });

    return count > 0;
  }
}
