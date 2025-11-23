import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
// import { WsJwtStrategy } from './strategies/ws-jwt.strategy';
// import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsAuthMiddleware } from './middlewares/ws-auth.middleware';
import { ChatGateway } from './chat.gateway';
import { ErrorResponseFactory } from './factories/error-response.factory';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    UsersModule,
    AuthModule,
    ConfigModule
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    WsAuthMiddleware,
    ErrorResponseFactory,
    JwtService
    ],
  exports: [ChatService],
})
export class ChatModule {}
