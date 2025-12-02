
import { Injectable, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { TelegramSetupService } from '../telegram-setup.service';

@Injectable()
export class TelegramBaseService {
  protected readonly logger: Logger;
  protected readonly bot: Telegraf;

  constructor(
    protected readonly telegramSetupService: TelegramSetupService,
    serviceName: string
  ) {
    this.logger = new Logger(serviceName);
    this.bot = this.telegramSetupService.getBotInstance();
  }

  /**
   * Базовый метод отправки сообщения с обработкой ошибок
   */
  async sendMessage(chatId: number, text: string): Promise<boolean> {
    try {
      await this.bot.telegram.sendMessage(chatId, text);
      this.logger.log(`Сообщение отправлено в чат ${chatId}`);
      return true;
    } catch (error) {
      this.logger.error(`Ошибка отправки сообщения в чат ${chatId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Отправка сообщения с Markdown разметкой
   */
  async sendMarkdownMessage(chatId: number, text: string): Promise<boolean> {
    try {
      await this.bot.telegram.sendMessage(chatId, text, { 
        parse_mode: 'Markdown' 
      });
      return true;
    } catch (error) {
      this.logger.error(`Ошибка отправки markdown сообщения: ${error.message}`);
      // Fallback к обычному сообщению
      return this.sendMessage(chatId, text.replace(/\*|_|`|\[|\]|\(|\)/g, ''));
    }
  }
}
