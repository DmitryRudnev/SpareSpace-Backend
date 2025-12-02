import { Injectable, Logger } from '@nestjs/common';
import type { TelegramWebhookUpdate, TelegramMessage } from '../interfaces';
import { UsersService } from '../../users/users.service';
import { TelegramStartHandlerService } from './command-handlers/telegram-start-handler.service';
import { TelegramProfileHandlerService } from './command-handlers/telegram-profile-handler.service';
import { TelegramListingsHandlerService } from './command-handlers/telegram-listings-handler.service';
import { TelegramBookingsHandlerService } from './command-handlers/telegram-bookings-handler.service';
import { TelegramSubscriptionHandlerService } from './command-handlers/telegram-subscription-handler.service';
import { TelegramWalletHandlerService } from './command-handlers/telegram-wallet-handler.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  /**
   * Конструктор сервиса Telegram.
   * @param {UsersService} usersService - Сервис для работы с пользователями.
   * @param {TelegramStartHandlerService} startHandlerService - Сервис для обработки команды /start.
   * @param {TelegramProfileHandlerService} profileHandlerService - Сервис для обработки команды /profile.
   * @param {TelegramListingsHandlerService} listingsHandlerService - Сервис для обработки команды /listings.
   * @param {TelegramBookingsHandlerService} bookingsHandlerService - Сервис для обработки команды /bookings.
   * @param {TelegramSubscriptionHandlerService} subscriptionHandlerService - Сервис для обработки команды /subscription.
   * @param {TelegramWalletHandlerService} walletHandlerService - Сервис для обработки команды /wallet.
   */
  constructor(
    private readonly usersService: UsersService,
    private readonly startHandlerService: TelegramStartHandlerService,
    private readonly profileHandlerService: TelegramProfileHandlerService,
    private readonly listingsHandlerService: TelegramListingsHandlerService,
    private readonly bookingsHandlerService: TelegramBookingsHandlerService,
    private readonly subscriptionHandlerService: TelegramSubscriptionHandlerService,
    private readonly walletHandlerService: TelegramWalletHandlerService,

  ) {}

  /**
   * Обрабатывает обновление от Telegram.
   * @param {TelegramWebhookUpdate} update - Обновление от Telegram.
   * @returns {Promise<void>} Промис, который разрешается после обработки обновления.
   */
  async handleUpdate(update: TelegramWebhookUpdate): Promise<void> {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      this.logger.error(`Ошибка обработки обновления: ${error.message}`, {
        updateId: update.update_id,
        stack: error.stack
      });
    }
  }

  /**
   * Обрабатывает входящее сообщение от пользователя.
   * @param {TelegramMessage} message - Сообщение от Telegram.
   * @returns {Promise<void>} Промис, который разрешается после обработки сообщения.
   * @private
   */
  private async handleMessage(message: TelegramMessage): Promise<void> {
    if (!message.from || !message.text) {
      this.logger.error('Отсутствует информация об отправителе или тексте сообщения');
      return;
    }

    const telegramId = message.from.id;
    const command = message.text.trim();
    const chatId = message.chat.id;

    if (!command.startsWith('/')) {
      await this.startHandlerService.sendMessage(chatId, 'Команда должна начинаться с "/"');
      return;
    }

    // Обработка команды /start (не требует привязки аккаунта)
    if (command.startsWith('/start')) {
      const verificationToken = command.split(/\s+/)[1];
      await this.startHandlerService.handle(telegramId, chatId, verificationToken);
      return;
    } else if (command.startsWith('/help')) {
      await this.sendHelpMessage(chatId);
      return;
    }

    // Проверка привязки аккаунта для остальных команд
    const userExists = await this.validateTelegramUser(telegramId, chatId, command);
    if (!userExists) {
      return;
    }

    // Обработка остальных команд
    if (command.startsWith('/profile')) {
      await this.profileHandlerService.handle(telegramId, chatId);

    } else if (command.startsWith('/listings')) {
      const page = this.extractPageNumber(command);
      await this.listingsHandlerService.handle(telegramId, chatId, page);

    } else if (command.startsWith('/bookings')) {
      const [_, role, pageStr] = command.split(/\s+/);
      const page = pageStr ? parseInt(pageStr) : 1;
      await this.bookingsHandlerService.handle(telegramId, chatId, role, page);

    } else if (command.startsWith('/subscription')) {
        await this.subscriptionHandlerService.handle(telegramId, chatId);

    } else if (command.startsWith('/wallet')) {
        await this.walletHandlerService.handle(telegramId, chatId);

      } else {
      await this.startHandlerService.sendMessage(chatId, 'Неизвестная команда. Используйте /help для списка команд.');
    }
  }

  /**
   * Обрабатывает callback query от кнопок.
   * @param {any} callbackQuery - Callback query от Telegram.
   * @returns {Promise<void>} Промис, который разрешается после обработки callback query.
   * @private
   */
  private async handleCallbackQuery(callbackQuery: any): Promise<void> {
    // TODO: Реализовать обработку callback query для кнопок
    this.logger.log('Callback query received:', callbackQuery);
  }

  /**
   * Проверяет, привязан ли пользователь к аккаунту.
   * @param {number} telegramId - Идентификатор пользователя в Telegram.
   * @param {number} chatId - Идентификатор чата.
   * @param {string} command - Команда, которую пытается выполнить пользователь.
   * @returns {Promise<boolean>} Промис, который разрешается в true, если пользователь привязан, иначе false.
   * @private
   */
  private async validateTelegramUser(telegramId: number, chatId: number, command: string): Promise<boolean> {
    try {
      await this.usersService.findByTelegramId(telegramId);
      return true;
    } catch (error) {
      this.logger.log(`Непривязанный пользователь ${telegramId} попытался использовать команду: ${command}`);
      await this.startHandlerService.sendBindingInstructions(chatId);
      return false;
    }
  }

  /**
   * Извлекает номер страницы из команды.
   * @param {string} command - Команда с номером страницы.
   * @returns {number} Номер страницы, по умолчанию 1.
   * @private
   */
  private extractPageNumber(command: string): number {
    const match = command.match(/\/\w+\s+(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Отправляет сообщение со справкой о доступных командах в указанный чат.
   * @param {number} chatId - Идентификатор чата, в который отправляется сообщение.
   * @returns {Promise<void>} Промис, который разрешается после отправки сообщения.
   * @private
   */
  private async sendHelpMessage(chatId: number): Promise<void> {
    const message = `🆘 *Доступные команды:*\n\n` +
      `🔹 /start - Начало работы с ботом\n` +
      `👤 /profile - Просмотр профиля\n` +
      `🏠 /listings *[страница]* - Мои объявления\n` +
      `📅 /bookings *[роль]* *[страница]* - Мои бронирования\n` +
      `🎫 /subscription - Информация о подписке\n` +
      `💰 /wallet - Баланс и транзакции\n` +
      `🆘 /help - Эта справка\n\n` +
      `*Параметры команд:*\n` +
      `• [[роль]]: all, landlord, renter\n` +
      `• [[страница]]: номер страницы (например, 2)\n\n` +
      `*Примеры:*\n` +
      `🔸 /listings 2 - вторая страница объявлений\n` +
      `🔸 /bookings landlord - бронирования как арендодатель (стр. 1)\n` +
      `🔸 /bookings renter 3 - бронирования как арендатор (стр. 3)\n` +
      `🔸 /wallet - баланс и последние транзакции`;

    await this.startHandlerService.sendMarkdownMessage(chatId, message);
  }
}
