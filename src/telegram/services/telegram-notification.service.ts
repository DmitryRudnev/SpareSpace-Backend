import { Injectable, Logger } from '@nestjs/common';
import { TelegramSenderService } from './telegram-sender.service';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { AnyNotificationPayload } from 'src/common/interfaces/notification-payloads.interface';


@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor(
    private readonly telegramSenderService: TelegramSenderService,
  ) {}

  async sendNotification(
    chatId: number, 
    type: NotificationType, 
    title: string, 
    body: string, 
    payload?: AnyNotificationPayload
  ): Promise<void> {
    // сделать свитч кейс на NotificationType
    // и вызвать соответствующие методы-хендлеры из этого класса
  }
}