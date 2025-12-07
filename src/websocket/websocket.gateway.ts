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
import { Logger, Injectable } from '@nestjs/common';

import type { AuthenticatedSocket } from './interfaces/socket.interface';
import { WsAuthMiddleware } from './middlewares/ws-auth.middleware';
import { ChatService } from '../chat/chat.service';
import { MessageMapper } from '../chat/mappers/message.mapper';
import { UserStatusService } from '../users/services/user-status.service';
import { WsResponseFactory } from './factories/ws-response.factory';

import { 
  WsJoinRoomRequestDto,
  WsLeaveRoomRequestDto,
  WsSendMessageRequestDto,
  WsMarkAsReadRequestDto,
  WsSubscribeStatusRequestDto,
  WsUnsubscribeStatusRequestDto,
  WsEditMessageRequestDto,
  WsDeleteMessagesRequestDto,
} from './dto/requests';
import { 
  WsMessagesReadResponseDto,
  WsResponseDto,
  WsNewMessageResponseDto,
  WsNewStatusResponseDto,
  WsEditMessageResponseDto,
  WsDeleteMessagesResponseDto,
  WsLastMessageResponseDto,
  WsUnreadsCountResponseDto,
} from './dto/responses';

@WebSocketGateway({
  namespace: '/',
  cors: {
    origin: true,
    credentials: true,
    transports: ['websocket', 'polling'],
  },
  pingTimeout: 30000, // 30 секунд таймаут для ping/pong
  pingInterval: 10000, // отправлять ping каждые 10 секунд
})
@Injectable()
export class MainWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MainWebSocketGateway.name);
  private server: Namespace;

  constructor(
    private readonly chatService: ChatService,
    private readonly wsAuthMiddleware: WsAuthMiddleware,
    private readonly userStatusService: UserStatusService,
  ) {}

  afterInit(server: Namespace) {
    this.server = server;
    this.logger.log('WebSocket gateway initialized');
    
    server.use((socket: Socket, next) => {
      this.wsAuthMiddleware.use(socket as AuthenticatedSocket, next);
    });
  }

  handleConnection(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client ${client.id} connected via WebSocket (userId: ${user.userId})`);
      
      // Устанавливаем онлайн-статус при подключении
      this.userStatusService.setOnline(user.userId).then(() => {
        this.notifyUserStatusChange(user.userId, true);  // Уведомляем подписчиков об изменении статуса
      }).catch((error) => {
        this.logger.error(`Failed to set online status for user ${user.userId}: ${error.message}`);
      });
    } else {
      this.logger.warn(`Client ${client.id} connected without authentication - this should not happen`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client ${client.id} disconnected (userId: ${user.userId})`);

      // Устанавливаем офлайн-статус при отключении
      this.userStatusService.setOffline(user.userId).then(() => {
        this.notifyUserStatusChange(user.userId, false);  // Уведомляем подписчиков об изменении статуса
      }).catch((error) => {
        this.logger.error(`Failed to set offline status for user ${user.userId}: ${error.message}`);
      });
    }
  }

  @SubscribeMessage('chat:join')
  async handleJoinRoom(
    @MessageBody() data: WsJoinRoomRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const userId = client.data.user.userId;
      const { conversationId } = data;

      // Подключаем клиента к комнате
      await this.chatService.verifyConversationAccess(conversationId, userId);
      client.join(`chat:${conversationId}`);
      this.logger.log(`User ${userId} joined room ${conversationId}`);
      
      // Сразу же шлём клиенту количество непрочитанных сообщений
      const unreadMessageIds = await this.chatService.getUnreadMessageIds(conversationId, userId, false);
      const unreadMessagesCount = unreadMessageIds.length;
      const unreadsResponse: WsUnreadsCountResponseDto = { conversationId, unreadMessagesCount };
      client.emit('unreads', unreadsResponse);

      // Сразу же шлём клиенту последнее сообщение
      const message = await this.chatService.getLastMessage(conversationId);
      const lastMessage = message ? MessageMapper.toResponseDto(message) : null;
      const lastMessageResponse: WsLastMessageResponseDto = { conversationId, lastMessage };
      client.emit('last-message', lastMessageResponse);

      return WsResponseFactory.success();
    } 
    catch (error) {
      this.logger.error(`Error in chat:join : ${error.message}`);
      return WsResponseFactory.error(error);
    }
  }

  @SubscribeMessage('chat:leave')
  async handleLeaveRoom(
    @MessageBody() data: WsLeaveRoomRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const userId = client.data.user.userId;
      const { conversationId } = data;
      await this.chatService.verifyConversationAccess(data.conversationId, userId);
      client.leave(`chat:${conversationId}`);
      
      this.logger.log(`User ${userId} left room ${conversationId}`);
      return WsResponseFactory.success();
    }
    catch (error) {
      this.logger.error(`Error in chat:leave: ${error.message}`, error.stack);
      return WsResponseFactory.error(error);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: WsSendMessageRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const senderId = client.data.user.userId;
      const { conversationId, text } = data;
      
      // Отправляем новое сообщение
      await this.chatService.verifyConversationAccess(conversationId, senderId);
      const message = await this.chatService.sendMessage(conversationId, senderId, text);
      const messageResponse = MessageMapper.toResponseDto(message);
      const newMessageResponse: WsNewMessageResponseDto = { 
        conversationId,
        message: messageResponse,
      };
      client.to(`chat:${conversationId}`).emit('message:new', newMessageResponse);
      this.logger.log(`User ${senderId} sent message to conversation ${conversationId}`);

      // Уведомляем подписчиков о новом последнем сообщении
      const lastMessageResponse: WsLastMessageResponseDto = { 
        conversationId,
        lastMessage: messageResponse,
      };
      client.to(`chat:${conversationId}`).emit('last-message', lastMessageResponse);

      // Уведомляем подписчиков о новом количестве непрочитанных сообщений
      const unreadMessageIds = await this.chatService.getUnreadMessageIds(conversationId, senderId, true);
      const unreadMessagesCount = unreadMessageIds.length;
      const unreadsResponse: WsUnreadsCountResponseDto = { conversationId, unreadMessagesCount };
      client.to(`chat:${conversationId}`).emit('unreads', unreadsResponse);
      
      return WsResponseFactory.successWithData({ message: messageResponse });
    }
    catch (error) {
      this.logger.error(`Error in message:send : ${error.message}`);
      return WsResponseFactory.error(error);
    }
  }

  @SubscribeMessage('message:read')
  async handleMarkAsRead(
    @MessageBody() data: WsMarkAsReadRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const userId = client.data.user.userId;
      const { conversationId, messageIds } = data;
      
      // Помечаем сообщения прочитанными
      await this.chatService.verifyConversationAccess(conversationId, userId);
      await this.chatService.markMessagesAsRead(conversationId, userId, messageIds);
      const response: WsMessagesReadResponseDto = {
        conversationId,
        userId,
        messageIds
      };
      client.to(`chat:${conversationId}`).emit('message:read-update', response);
      this.logger.log(`User ${userId} marked messages as read in conversation ${conversationId}`);

      // Обновляем последнее сообщение, если его тоже пометили прочитанным
      const lastMessageId = await this.chatService.getLastMessageId(conversationId);
      if (lastMessageId && messageIds?.includes(lastMessageId)) {
        const message = await this.chatService.getLastMessage(conversationId);
        const lastMessage = message ? MessageMapper.toResponseDto(message) : null;
        const lastMessageResponse: WsLastMessageResponseDto = {
          conversationId,
          lastMessage,
        };
        client.to(`chat:${conversationId}`).emit('last-message', lastMessageResponse);
      }

      return WsResponseFactory.success();
    } 
    catch (error) {
      this.logger.error(`Error in message:read: ${error.message}`);
      return WsResponseFactory.error(error);
    }
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @MessageBody() data: WsEditMessageRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const { messageId, newText, conversationId } = data;
      const userId = client.data.user.userId;
      
      // Редактируем сообщение
      await this.chatService.verifyConversationAccess(conversationId, userId);
      await this.chatService.verifyMessageOwnership([messageId], conversationId, userId);
      const editedMessage = await this.chatService.editMessage(messageId, newText);
      const messageResponse = MessageMapper.toResponseDto(editedMessage);
      const response: WsEditMessageResponseDto = {
        conversationId,
        message: messageResponse,
      };
      client.to(`chat:${conversationId}`).emit('message:edited', response);
      this.logger.log(`User ${userId} edited message ${data.messageId}`);

      // Обновляем последнее сообщение, если отредактировали его
      const lastMessageId = await this.chatService.getLastMessageId(conversationId);
      if (messageId === lastMessageId) {
        const lastMessageResponse: WsLastMessageResponseDto = {
          conversationId,
          lastMessage: messageResponse,
        };
        client.to(`chat:${conversationId}`).emit('last-message', lastMessageResponse);
      }

      return WsResponseFactory.successWithData({ message: messageResponse });
    } 
    catch (error) {
      this.logger.error(`Error in message:edit: ${error.message}`);
      return WsResponseFactory.error(error);
    }
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessages(
    @MessageBody() data: WsDeleteMessagesRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const userId = client.data.user.userId;
      const { conversationId, messageIds } = data;

      // Сразу сохраняем данные перед удалением сообщений
      const lastMessageId = await this.chatService.getLastMessageId(conversationId);
      const unreadMessagesIds = await this.chatService.getUnreadMessageIds(conversationId, userId, true);

      // Удаляем сообщения
      await this.chatService.verifyConversationAccess(conversationId, userId);
      await this.chatService.verifyMessageOwnership(messageIds, conversationId, userId);
      await this.chatService.deleteMessages(messageIds, conversationId);
      const response: WsDeleteMessagesResponseDto = { conversationId, deletedMessageIds: messageIds };
      client.to(`chat:${conversationId}`).emit('message:deleted', response);
      this.logger.log(`User ${userId} deleted ${messageIds.length} messages`);
      
      // Обновляем последнее сообщение, если удалили его
      if (lastMessageId && messageIds.includes(lastMessageId)) {
        const newLastMessage = await this.chatService.getLastMessage(conversationId);
        const messageResponse = newLastMessage ? MessageMapper.toResponseDto(newLastMessage) : null;
        const lastMessageResponse: WsLastMessageResponseDto = { conversationId, lastMessage: messageResponse };
        client.to(`chat:${conversationId}`).emit('last-message', lastMessageResponse);
      }

      // Обновляем количество непрочитанных сообщений, если удалили хоть одно из них
      if (unreadMessagesIds.some(id => messageIds.includes(id))) {
        const newUnreadMessageIds = await this.chatService.getUnreadMessageIds(conversationId, userId, true);
        const unreadMessagesCount = newUnreadMessageIds.length;
        const unreadsResponse: WsUnreadsCountResponseDto = { conversationId, unreadMessagesCount };
        client.to(`chat:${conversationId}`).emit('unreads', unreadsResponse);
      }

      return WsResponseFactory.success();
    } 
    catch (error) {
      this.logger.error(`Error in message:delete: ${error.message}`);
      return WsResponseFactory.error(error);
    }
  }

  @SubscribeMessage('user:status:subscribe')
  async handleSubscribeToUserStatus(
    @MessageBody() data: WsSubscribeStatusRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const subscriberId = client.data.user.userId;
      const targetUserId = data.userId;

      // Подключаем клиента к комнате
      client.join(`user:status:${targetUserId}`);      
      this.logger.log(`User ${subscriberId} subscribed to status of user ${targetUserId}`);
      
      // Сразу отправляем клиенту данные о статусе другого пользователя
      const status = await this.userStatusService.getUserStatus(targetUserId);
      const response: WsNewStatusResponseDto = {
        userId: targetUserId,
        isOnline: status.isOnline,
        lastSeenAt: status.lastSeenAt.toISOString()
      };
      client.emit('user:status', response);

      return WsResponseFactory.success();
    } 
    catch (error) {
      this.logger.error(`Error in user:status:subscribe: ${error.message}`);
      return WsResponseFactory.error(error);
    }
  }

  /**
   * Отписка от статуса пользователя
   */
  @SubscribeMessage('user:status:unsubscribe')
  async handleUnsubscribeFromUserStatus(
    @MessageBody() data: WsUnsubscribeStatusRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const subscriberId = client.data.user.userId;
      const targetUserId = data.userId;

      // Отключаем клиента от комнаты
      client.leave(`user:status:${targetUserId}`);
      this.logger.log(`User ${subscriberId} unsubscribed from status of user ${targetUserId}`);

      return WsResponseFactory.success();
    }
    catch (error) {
      this.logger.error(`Error in user:status:unsubscribe: ${error.message}`);
      return WsResponseFactory.error(error);
    }
  }

  /**
   * Уведомление подписчиков об изменении статуса пользователя
   */
  private async notifyUserStatusChange(userId: number, isOnline: boolean) {
    try {
      // Получаем актуальные данные о статусе пользователя и рассылаем событие всем подписчикам
      const status = await this.userStatusService.getUserStatus(userId);
      const response: WsNewStatusResponseDto = {
        userId,
        isOnline: status.isOnline,
        lastSeenAt: status.lastSeenAt.toISOString()
      };
      this.server.to(`user:status:${userId}`).emit('user:status', response);
      this.logger.log(`User ${userId} status changed to ${isOnline ? 'online' : 'offline'}`);
    } 
    catch (error) {
      this.logger.error(`Failed to notify status change for user ${userId}: ${error.message}`);
    }
  }
}
