import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as IP from 'ip';

@Injectable()
export class TelegramWebhookGuard implements CanActivate {
  private readonly logger = new Logger(TelegramWebhookGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!this.validateSecretToken(request)) {
      throw new ForbiddenException('Invalid secret token');
    }

    if (!request.ip || !this.validateIP(request.ip)) {
      throw new ForbiddenException('IP not allowed');
    }
    
    return true;
  }

  private validateSecretToken(request: Request): boolean {
    const incomingToken = request.headers['x-telegram-bot-api-secret-token'] as string;
    const expectedToken = this.configService.get<string>('TELEGRAM_WEBHOOK_TOKEN');
    return incomingToken === expectedToken;
  }

  private validateIP(ip: string): boolean {
    const allowedIPs = this.configService.get<string[]>('telegram.webhook.allowedIPs', []);
    return allowedIPs.some(range => IP.cidrSubnet(range).contains(ip));
  }
}
