import { Injectable, Logger } from '@nestjs/common';
import type { TelegramWebhookUpdate, TelegramMessage, TelegramCallbackQuery } from '../interfaces';
import { UsersService } from '../../users/services/users.service';
import { TelegramStartHandlerService,
  TelegramProfileHandlerService,
  TelegramListingsHandlerService,
  TelegramBookingsHandlerService,
  TelegramSubscriptionHandlerService,
  TelegramWalletHandlerService,
 } from './command-handlers';
 import { TelegramSenderService } from './telegram-sender.service';
import { PaginationCallbackData } from '../dto/callback-data.dto';
import { UserRoleType } from '../../common/enums/user-role-type.enum';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);


  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly startHandlerService: TelegramStartHandlerService,
    private readonly profileHandlerService: TelegramProfileHandlerService,
    private readonly listingsHandlerService: TelegramListingsHandlerService,
    private readonly bookingsHandlerService: TelegramBookingsHandlerService,
    private readonly subscriptionHandlerService: TelegramSubscriptionHandlerService,
    private readonly walletHandlerService: TelegramWalletHandlerService,
    private readonly usersService: UsersService,
  ) {}


  async handleUpdate(update: TelegramWebhookUpdate): Promise<void> {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      } else {
        this.logger.error('Ещё не реализована обработка данного типа обновления от телеграма');
      }
    } catch (error) {
      this.logger.error(`Ошибка обработки обновления: ${error.message}`, {
        updateId: update.update_id,
        stack: error.stack
      });
    }
  }

  
  private async handleMessage(message: TelegramMessage): Promise<void> {
    if (!message.from || !message.text) {
      this.logger.error('Отсутствует информация об отправителе или тексте сообщения');
      return;
    }

    const telegramId = message.from.id;
    const command = message.text.trim();
    const chatId = message.chat.id;

    if (!command.startsWith('/')) {
      await this.telegramSenderService.sendMessage(chatId, 'Команда должна начинаться с "/"');
      return;
    }

    if (command.startsWith('/start')) {
      const verificationToken = command.split(/\s+/)[1];
      await this.startHandlerService.handle(telegramId, chatId, verificationToken);
      return;
    } else if (command.startsWith('/help')) {
      await this.sendHelpMessage(chatId);
      return;
    }

    const userExists = await this.validateTelegramUser(telegramId, chatId, command);
    if (!userExists) {
      return;
    }

    if (command.startsWith('/profile')) {
      await this.profileHandlerService.handle(telegramId, chatId);
    } else if (command.startsWith('/listings')) {
      await this.listingsHandlerService.handle(telegramId, chatId);
    } else if (command.startsWith('/bookings')) {
      await this.bookingsHandlerService.handle(telegramId, chatId);
    } else if (command.startsWith('/subscription')) {
      await this.subscriptionHandlerService.handle(telegramId, chatId);
    } else if (command.startsWith('/wallet')) {
      await this.walletHandlerService.handle(telegramId, chatId);
    } else {
      await this.telegramSenderService.sendMessage(chatId, 'Неизвестная команда. Используйте /help для списка команд.');
    }
  }


  private async handleCallbackQuery(callbackQuery: TelegramCallbackQuery): Promise<void> {
    try {
      const { id: callbackId, data, from, message } = callbackQuery;
      const telegramId = from.id;
      const chatId = message?.chat.id;
      const messageId = message?.message_id;

      if (!data || !chatId || !messageId) {
        this.logger.error('Недостаточно данных в callback query');
        await this.telegramSenderService.answerCallbackQuery(callbackId, '⚠️ Ошибка обработки запроса');
        return;
      }

      if (data === 'noop') {
        await this.telegramSenderService.answerCallbackQuery(callbackId);
        return;
      }

      // 1. Обработка выбора роли (нажатие кнопок "Я арендатор" / "Я арендодатель")
      if (data.startsWith('bookings:role:')) {
        const userExists = await this.validateTelegramUser(telegramId, chatId, data);
        if (!userExists) {
          await this.telegramSenderService.answerCallbackQuery(callbackId, '❌ Сначала привяжите аккаунт');
          return;
        }
         const roleStr = data.split(':')[2];
         const role = roleStr === 'landlord' ? UserRoleType.LANDLORD : UserRoleType.RENTER;
         
         // Загружаем первую страницу для выбранной роли
         await this.bookingsHandlerService.sendBookingsPage(telegramId, chatId, role, 1, messageId);
         await this.telegramSenderService.answerCallbackQuery(callbackId);
         return;
      }

      // 2. Обработка пагинации (listings или bookings)
      if (data.startsWith('listings:') || data.startsWith('bookings:')) {
        const userExists = await this.validateTelegramUser(telegramId, chatId, data);
        if (!userExists) {
          await this.telegramSenderService.answerCallbackQuery(callbackId, '❌ Сначала привяжите аккаунт');
          return;
        }

        const callbackData = PaginationCallbackData.fromString(data);
        
        // Проверяем, не пытаемся ли мы уйти в минус (хотя кнопки должны быть заблокированы)
        if (callbackData.page < 1) {
          await this.telegramSenderService.answerCallbackQuery(callbackId, '⚠️ Вы уже на первой странице');
          return;
        }

        // --- Обработка объявлений ---
        if (callbackData.entity === 'listings') {
          await this.handleListingsPagination(
            callbackId, chatId, messageId, callbackData.page, telegramId
          );
        }
        
        // --- Обработка бронирований ---
        else if (callbackData.entity === 'bookings') {
          // Извлекаем роль из поля 'extra'
          const roleStr = callbackData.extra; 
          const role = roleStr === 'landlord' ? UserRoleType.LANDLORD : UserRoleType.RENTER;

          await this.bookingsHandlerService.sendBookingsPage(
             telegramId, 
             chatId, 
             role, 
             callbackData.page, 
             messageId
          );
          await this.telegramSenderService.answerCallbackQuery(callbackId);
        }
      }
    } catch (error) {
      this.logger.error(`Ошибка обработки callback query: ${error.message}`);
      try {
        await this.telegramSenderService.answerCallbackQuery(callbackQuery.id, '⚠️ Произошла ошибка');
      } catch (answerError) { /* ignore */ }
    }
  }


  private async handleListingsPagination(
    callbackId: string,
    chatId: number,
    messageId: number,
    page: number,
    telegramId: number,
    extra?: string
  ): Promise<void> {
    try {
      await this.listingsHandlerService.handleCallback(
        chatId,
        messageId,
        page,
        telegramId
      );
      await this.telegramSenderService.answerCallbackQuery(callbackId);
    } catch (error) {
      this.logger.warn(`Ошибка пагинации listings: ${error.message}`);
      
      if (error.message.includes('первой странице') || error.message.includes('последней странице')) {
        await this.telegramSenderService.answerCallbackQuery(callbackId, error.message);
      } else {
        await this.telegramSenderService.answerCallbackQuery(callbackId, '⚠️ Не удалось загрузить страницу');
      }
    }
  }

  
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

  
  private async sendHelpMessage(chatId: number): Promise<void> {
    const message = `🆘 *Доступные команды:*\n\n` +
      `🔹 /start - Начало работы с ботом\n` +
      `👤 /profile - Просмотр профиля\n` +
      `🏠 /listings - Мои объявления\n` +
      `📅 /bookings - Мои бронирования\n` +
      `🎫 /subscription - Информация о подписке\n` +
      `💰 /wallet - Баланс и транзакции\n` +
      `🆘 /help - Эта справка`;

    await this.telegramSenderService.sendMarkdownMessage(chatId, message);
  }
}
