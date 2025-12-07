import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { WsAuthMiddleware } from './middlewares/ws-auth.middleware';
import { ChatModule } from '../chat/chat.module';
import { MainWebSocketGateway } from './websocket.gateway';

@Module({
  imports: [UsersModule, ChatModule],
  providers: [
    MainWebSocketGateway,
    WsAuthMiddleware,
  ],
})
export class WebSocketModule {}
