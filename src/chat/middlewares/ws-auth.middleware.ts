import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  data: {
    user: { userId: number; roles: string[] };
  };
}

@Injectable()
export class WsAuthMiddleware {
  private readonly logger = new Logger(WsAuthMiddleware.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
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

      // ВАЖНО: Явно передаем секрет при верификации
      const secret = this.configService.get('JWT_SECRET');
      if (!secret) {
        throw new Error('JWT secret not configured');
      }

      // Верифицируем токен с явным указанием секрета
      const payload = this.jwtService.verify(token, { secret });
      
      if (!payload.sub) {
        throw new Error('Invalid token payload');
      }

      // Сохраняем пользователя в data сокета
      client.data.user = {
        userId: parseInt(payload.sub, 10),
        roles: payload.roles || []
      };

      this.logger.log(`User ${client.data.user.userId} authenticated via WebSocket`);
      next();
    } catch (error) {
      this.logger.error(`WebSocket authentication failed: ${error.message}`);
      if (error.name === 'JsonWebTokenError') {
        this.logger.error(`JWT Error: ${error.message}`);
      }
      if (error.name === 'TokenExpiredError') {
        this.logger.error('JWT Token expired');
      }
      next(new Error('Authentication failed'));
    }
  }
}
