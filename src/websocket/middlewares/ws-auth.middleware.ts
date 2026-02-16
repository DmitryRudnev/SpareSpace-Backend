import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { AuthenticatedSocket } from '../interfaces/socket.interface';

@Injectable()
export class WsAuthMiddleware {
  private readonly logger = new Logger(WsAuthMiddleware.name);

  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
  ) {}

  async use(client: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      // Получаем токен из handshake
      const token = client.handshake.auth?.token || 
                   client.handshake.headers?.authorization?.replace('Bearer ', '') ||
                   client.handshake.query?.token as string;
      if (!token) {
        throw new Error(`No token provided for connection; client.id: ${client.id}`);
      }

      // Валидируем access токен
      const payload = this.jwtService.verify(token);
      if (!payload.sub || isNaN(payload.sub)) {
        throw new Error(`Invalid token payload; client.id: ${client.id}`);
      }
      
      // Валидируем ID пользователя
      const userId = parseInt(payload.sub, 10);
      try {
        await this.userService.findById(userId);
      }
      catch (error) {
        throw new Error(error.message);
      }

      if (!payload.roles || payload.roles.length === 0) {
        throw new Error(`User ${userId} has no assigned roles`);
      }

      // Сохраняем пользователя в data сокета
      client.data.user = {
        userId: parseInt(payload.sub, 10),
        roles: payload.roles
      };
      this.logger.log(`User ${client.data.user.userId} successfully authenticated via WebSocket; client.id: ${client.id}`);
      next();
    } 
    catch (error) {
      this.logger.error(`WebSocket authentication failed: ${error.message}`);
      return next(new Error('Authentication failed'));
    }
  }
}
