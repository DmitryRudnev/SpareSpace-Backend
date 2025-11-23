import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

import { ChatService } from './chat.service';
import { WsAuthMiddleware } from './middlewares/ws-auth.middleware';
import { ErrorResponseFactory } from './factories/error-response.factory';
import { MessageMapper } from './mappers/message.mapper';

import { WsJoinRoomRequestDto } from './dto/requests/ws-join-room-request.dto';
import { WsSendMessageRequestDto } from './dto/requests/ws-send-message-request.dto';
import { WsMarkAsReadRequestDto } from './dto/requests/ws-mark-as-read-request.dto';
import { WsJoinRoomResponseDto } from './dto/responses/ws-join-room-response.dto';
import { WsNewMessageResponseDto } from './dto/responses/ws-new-message-response.dto';
import { WsMessagesReadResponseDto } from './dto/responses/ws-messages-read-response.dto';

/**
 * Расширенный интерфейс сокета с данными аутентифицированного пользователя
 * @interface AuthenticatedSocket
 * @extends {Socket}
 */
interface AuthenticatedSocket extends Socket {
  data: {
    user: { userId: number; roles: string[] };
  };
}

/**
 * WebSocket шлюз для обработки реального времени чата
 * @class ChatGateway
 * @implements {OnGatewayInit}
 * @implements {OnGatewayConnection}
 * @implements {OnGatewayDisconnect}
 */
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    // origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    origin: true,
    credentials: true
  }
})
@Injectable()
@UsePipes(new ValidationPipe({ transform: true }))
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  /**
   * Конструктор шлюза чата
   * @param {ChatService} chatService - сервис бизнес-логики чата
   * @param {WsAuthMiddleware} wsAuthMiddleware - middleware для аутентификации WebSocket соединений
   */
  constructor(
    private readonly chatService: ChatService,
    private readonly wsAuthMiddleware: WsAuthMiddleware,
  ) {}

  /**
   * Метод инициализации WebSocket шлюза
   * @param {Namespace} server - экземпляр namespace Socket.io
   */
  afterInit(server: Namespace) {
    this.logger.log('WebSocket gateway initialized');
    server.use((socket: Socket, next) => {
      this.wsAuthMiddleware.use(socket as AuthenticatedSocket, next);
    });
  }

  /**
   * Обработчик установления соединения
   * @param {AuthenticatedSocket} client - аутентифицированный сокет клиента
   */
  handleConnection(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`User ${user.userId} connected via WebSocket`);
    } else {
      this.logger.warn('Client connected without authentication - this should not happen');
      client.disconnect();
    }
  }

  /**
   * Обработчик разрыва соединения
   * @param {AuthenticatedSocket} client - аутентифицированный сокет клиента
   */
  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`User ${user.userId} disconnected`);
    }
  }

  /**
   * Обработчик присоединения к комнате чата
   * @param {WsJoinRoomRequestDto} data - DTO с данными для присоединения к комнате
   * @param {AuthenticatedSocket} client - аутентифицированный сокет клиента
   * @returns {Promise<void>}
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: WsJoinRoomRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const userId = client.data.user.userId;
      await this.chatService.findConversationById(data.conversationId, userId);
      
      client.join(String(data.conversationId));
      
      const response: WsJoinRoomResponseDto = {
        conversationId: data.conversationId,
        status: 'success'
      };
      
      client.emit('joinedRoom', response);
      this.logger.log(`User ${userId} joined room ${data.conversationId}`);
    } catch (error) {
      client.emit('error', ErrorResponseFactory.fromException(error));
      this.logger.error(`Error in joinRoom: ${error.message}`);
    }
  }

  /**
   * Обработчик отправки сообщения в чат
   * @param {WsSendMessageRequestDto} data - DTO с данными сообщения
   * @param {AuthenticatedSocket} client - аутентифицированный сокет клиента
   * @returns {Promise<void>}
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: WsSendMessageRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const { conversationId, text } = data;
      const senderId = client.data.user.userId;
      
      await this.chatService.findConversationById(conversationId, senderId);
      const message = await this.chatService.sendMessage(conversationId, senderId, text);
      
      const messageDto = MessageMapper.toResponseDto(message);
      const response: WsNewMessageResponseDto = { message: messageDto };
      
      const room = String(conversationId);
      client.to(room).emit('newMessage', response);
      client.emit('messageSent', response);
      
      this.logger.log(`User ${senderId} sent message to conversation ${conversationId}`);
    } catch (error) {
      client.emit('error', ErrorResponseFactory.fromException(error));
      this.logger.error(`Error in sendMessage: ${error.message}`);
    }
  }

  /**
   * Обработчик отметки сообщений как прочитанных
   * @param {WsMarkAsReadRequestDto} data - DTO с данными для отметки сообщений
   * @param {AuthenticatedSocket} client - аутентифицированный сокет клиента
   * @returns {Promise<void>}
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: WsMarkAsReadRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const { conversationId, messageIds } = data;
      const userId = client.data.user.userId;
      
      await this.chatService.markMessagesAsRead(conversationId, userId, messageIds);
      
      const response: WsMessagesReadResponseDto = {
        conversationId,
        userId,
        messageIds
      };
      
      client.to(String(conversationId)).emit('messagesRead', response);
      this.logger.log(`User ${userId} marked messages as read in conversation ${conversationId}`);
    } catch (error) {
      client.emit('error', ErrorResponseFactory.fromException(error));
      this.logger.error(`Error in markAsRead: ${error.message}`);
    }
  }
}
