import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { TelegramVerificationService } from '../telegram-verification.service';
import { TelegramSenderService } from '../telegram-sender.service';
import { User } from '../../../entities/user.entity';


@Injectable()
export class TelegramStartHandlerService {
  private readonly logger = new Logger(TelegramStartHandlerService.name);

  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly verificationService: TelegramVerificationService,
    private readonly usersService: UsersService,
  ) {}


  async handle(
    telegramId: number, 
    chatId: number,
    verificationToken?: string
  ): Promise<void> {
    try {
      const existingUser = await this.usersService.findByTelegramId(telegramId);
      await this.handleExistingUserScenario(existingUser, telegramId, chatId, verificationToken);
    } catch (error) {
      if (error instanceof NotFoundException) {
        await this.handleNewUserScenario(telegramId, chatId, verificationToken);
      }
      else {
        throw error;
      }
    }
  }

  
  private async handleExistingUserScenario(
    existingUser: User,
    telegramId: number,
    chatId: number,
    verificationToken?: string
  ): Promise<void> {
    if (!verificationToken) {
      await this.sendWelcomeMessage(chatId, existingUser.firstName);
      return;
    }

    this.logger.log(`Попытка смены привязки аккаунта для пользователя ${existingUser.id}`);
    await this.telegramSenderService.sendMessage(chatId, 'Обнаружена попытка смены привязанного аккаунта...');
    await this.processTokenVerificationForExistingUser(existingUser, telegramId, chatId, verificationToken);
  }

  
  private async handleNewUserScenario(
    telegramId: number,
    chatId: number,
    verificationToken?: string
  ): Promise<void> {
    if (!verificationToken) {
      this.logger.log(`Новый пользователь ${telegramId} запросил инструкции по привязке`);
      await this.sendBindingInstructions(chatId);
      return;
    }

    this.logger.log(`Попытка привязки нового пользователя ${telegramId} по токену`);
    await this.processTokenVerificationForNewUser(telegramId, chatId, verificationToken);
  }

  
  private async processTokenVerificationForExistingUser(
    existingUser: User,
    telegramId: number,
    chatId: number,
    token: string
  ): Promise<void> {
    if (token.length !== 64) {
      this.logger.warn(`Неверный формат токена от пользователя ${telegramId}`);
      await this.sendInvalidTokenMessage(chatId);
      return;
    }

    try {
      const userFromToken = await this.verificationService.verifyToken(token, telegramId);
      
      // Если токен для того же пользователя
      if (existingUser.id === userFromToken.id) {
        await this.sendAlreadyLinkedMessage(chatId);
        this.logger.log(`Пользователь ${telegramId} уже привязан к аккаунту ${userFromToken.id}`);
        return;
      }

      this.logger.log(`Отвязывание Telegram ${telegramId} от аккаунта ${existingUser.id}`);
      await this.usersService.updateTelegramId(existingUser.id, null);
      
      this.logger.log(`Привязывание Telegram ${telegramId} к аккаунту ${userFromToken.id}`);
      await this.usersService.updateTelegramId(userFromToken.id, telegramId);
      
      await this.sendAccountRelinkedMessage(chatId, userFromToken.firstName);
      this.logger.log(`Успешная перепривязка Telegram ${telegramId} с аккаунта ${existingUser.id} на ${userFromToken.id}`);

    } catch (error) {
      this.logger.warn(`Ошибка верификации токена для существующего пользователя ${telegramId}: ${error.message}`);
      await this.sendInvalidTokenMessage(chatId);
    }
  }

  
  private async processTokenVerificationForNewUser(
    telegramId: number,
    chatId: number,
    token: string
  ): Promise<void> {
    if (token.length !== 64) {
      this.logger.warn(`Неверный формат токена от нового пользователя ${telegramId}`);
      await this.sendInvalidTokenMessage(chatId);
      return;
    }

    try {
      const user = await this.verificationService.verifyToken(token, telegramId);
      await this.usersService.updateTelegramId(user.id, telegramId);
      await this.sendWelcomeMessage(chatId, user.firstName);
      this.logger.log(`Успешная привязка нового пользователя ${telegramId} к аккаунту ${user.id}`);
    } catch (error) {
      this.logger.warn(`Ошибка верификации токена для нового пользователя ${telegramId}: ${error.message}`);
      await this.sendInvalidTokenMessage(chatId);
    }
  }

  
  private async sendWelcomeMessage(chatId: number, firstName: string): Promise<boolean> {
    const message = `👋 Добро пожаловать, ${firstName}!\n\n` + 
      `🤖 *Доступные команды:*\n\n` +
      `🔹 /start\n  - Начало работы с ботом\n\n` +
      `👤 /profile\n  - Просмотр профиля\n\n` + 
      `🏠 /listings\n  - Мои объявления\n\n` +
      `📅 /bookings\n  - Мои бронирования\n\n` +
      `🎫 /subscription\n  - Информация о подписке\n\n` +
      `💰 /wallet\n  - Баланс и транзакции\n\n` +
      `🆘 /help\n  - Помощь`;

    return this.telegramSenderService.sendMarkdownMessage(chatId, message);
  }

  
  async sendBindingInstructions(chatId: number): Promise<boolean> {
    const message = `🔐 Для использования бота необходимо привязать аккаунт\n\n` + 
      `1. Откройте веб-приложение\n` + 
      `2. Перейдите в раздел "Настройки" → "Telegram"  \n` + 
      `3. Нажмите "Привязать аккаунт"\n` + 
      `4. Перейдите по полученной ссылке для активации\n\n` + 
      `🔑 После привязки вы получите доступ ко всем функциям бота.`;

    return this.telegramSenderService.sendMessage(chatId, message);
  }

  
  private async sendInvalidTokenMessage(chatId: number): Promise<boolean> {
    const message = `❌ Неверный или просроченный токен. Запросите новую ссылку в приложении.\n\n` +
      `1. Откройте веб-приложение\n` + 
      `2. Перейдите в раздел "Настройки" → "Telegram"  \n` + 
      `3. Нажмите "Привязать аккаунт"\n` + 
      `4. Перейдите по полученной ссылке для активации\n\n` + 
      `🔑 После привязки вы получите доступ ко всем функциям бота.`;

    return this.telegramSenderService.sendMessage(chatId, message);
  }

  
  private async sendAccountRelinkedMessage(chatId: number, firstName: string): Promise<boolean> {
    const message = `🔄 Аккаунт успешно перепривязан! Добро пожаловать, ${firstName}!`;
    return this.telegramSenderService.sendMessage(chatId, message);
  }

  
  private async sendAlreadyLinkedMessage(chatId: number): Promise<boolean> {
    const message = 'ℹ️ Ваш Telegram уже привязан к этому аккаунту.';
    return this.telegramSenderService.sendMessage(chatId, message);
  }
}
