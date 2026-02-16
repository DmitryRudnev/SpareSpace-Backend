import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { WsAuthMiddleware } from './middlewares/ws-auth.middleware';
import { ChatModule } from '../chat/chat.module';
import { MainWebSocketGateway } from './websocket.gateway';
import { WsExceptionsFilter } from './filters/ws-exception.filter';

@Module({
  imports: [UsersModule, ChatModule],
  providers: [
    MainWebSocketGateway,
    WsAuthMiddleware,
    WsExceptionsFilter,
  ],
  exports: [
    MainWebSocketGateway,
  ],
})
export class WebSocketModule {}
