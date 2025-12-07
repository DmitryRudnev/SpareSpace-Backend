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
      this.logger.log(`Authenticating WebSocket connection: ${client.id}`);

      // Получаем токен из handshake
      const token = client.handshake.auth?.token || 
                   client.handshake.headers?.authorization?.replace('Bearer ', '') ||
                   client.handshake.query?.token as string;
      this.logger.log(`Token received: ${token ? 'yes' : 'no'}`);
      if (!token) {
        this.logger.warn(`No token provided for connection: ${client.id}`);
        throw new Error('Authentication token not provided');
      }

      // Валидируем access токен
      const payload = this.jwtService.verify(token);
      if (!payload.sub || isNaN(payload.sub)) {
        throw new Error('Invalid token payload');
      }
      
      // Валидируем ID пользователя
      const userId = parseInt(payload.sub, 10);
      try {
        await this.userService.findById(userId);
      }
      catch (error) {
        throw new Error(error.message);
      }
  
      // Валидируем роли пользователя
      const roles = await this.userService.getUserRoles(userId);
      if (!roles || roles.length === 0) {
        throw new Error('User has no assigned roles');
      }

      // Сохраняем пользователя в data сокета
      client.data.user = {
        userId: parseInt(payload.sub, 10),
        roles: payload.roles || []
      };
      this.logger.log(`User ${client.data.user.userId} authenticated via WebSocket`);
      next();
    } 
    catch (error) {
      this.logger.error(`WebSocket authentication failed: ${error.message}`);
      if (error.name === 'JsonWebTokenError') {
        this.logger.error(`JWT Error: ${error.message}`);
      }
      if (error.name === 'TokenExpiredError') {
        this.logger.error('JWT Token expired');
      }
      return next(new Error('Authentication failed'));
    }
  }
}
