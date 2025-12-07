import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { TelegramVerificationService } from '../telegram-verification.service';
import { TelegramBaseService } from './telegram-base.service';
import { TelegramSetupService } from '../telegram-setup.service';
import { User } from '../../../entities/user.entity';

/**
 * Сервис для обработки команды /start в Telegram боте
 * Отвечает за сценарии привязки и перепривязки Telegram аккаунтов к пользователям системы
 * @class
 * @public
 */
@Injectable()
export class TelegramStartHandlerService extends TelegramBaseService {
  constructor(
    telegramSetupService: TelegramSetupService,
    private readonly usersService: UsersService,
    private readonly verificationService: TelegramVerificationService,
  ) {
    super(telegramSetupService, TelegramStartHandlerService.name);
  }

  /**
   * Обрабатывает команду /start с различными сценариями:
   * - Новый пользователь без токена
   * - Новый пользователь с токеном
   * - Существующий пользователь без токена
   * - Существующий пользователь с токеном (смена привязки)
   * @param {number} telegramId - уникальный идентификатор пользователя в Telegram
   * @param {number} chatId - идентификатор чата для отправки ответов
   * @param {string} [verificationToken] - токен верификации для привязки аккаунта
   * @returns {Promise<void>}
   * @throws {Error} при критических ошибках работы с базой данных
   */
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

  /**
   * Обрабатывает сценарий для пользователя, который уже привязан к Telegram аккаунту
   * @param {User} existingUser - объект пользователя, уже привязанного к этому Telegram ID
   * @param {number} telegramId - уникальный идентификатор пользователя в Telegram
   * @param {number} chatId - идентификатор чата для отправки ответов
   * @param {string} [verificationToken] - токен верификации для перепривязки аккаунта
   * @returns {Promise<void>}
   * @private
   */
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
    await this.sendMessage(chatId, 'Обнаружена попытка смены привязанного аккаунта...');
    await this.processTokenVerificationForExistingUser(existingUser, telegramId, chatId, verificationToken);
  }

  /**
   * Обрабатывает сценарий для нового пользователя, не привязанного к системе
   * @param {number} telegramId - уникальный идентификатор пользователя в Telegram
   * @param {number} chatId - идентификатор чата для отправки ответов
   * @param {string} [verificationToken] - токен верификации для привязки аккаунта
   * @returns {Promise<void>}
   * @private
   */
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

  /**
   * Обрабатывает верификацию токена для существующего пользователя (сценарий смены привязки)
   * Включает проверку формата токена, верификацию и перепривязку аккаунта
   * @param {User} existingUser - текущий привязанный пользователь
   * @param {number} telegramId - уникальный идентификатор пользователя в Telegram
   * @param {number} chatId - идентификатор чата для отправки ответов
   * @param {string} token - токен верификации из команды /start
   * @returns {Promise<void>}
   * @private
   */
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

      // Отвязываем текущий аккаунт
      this.logger.log(`Отвязывание Telegram ${telegramId} от аккаунта ${existingUser.id}`);
      await this.usersService.updateTelegramId(existingUser.id, null);
      
      // Привязываем новый аккаунт
      this.logger.log(`Привязывание Telegram ${telegramId} к аккаунту ${userFromToken.id}`);
      await this.usersService.updateTelegramId(userFromToken.id, telegramId);
      
      await this.sendAccountRelinkedMessage(chatId, userFromToken.firstName);
      this.logger.log(`Успешная перепривязка Telegram ${telegramId} с аккаунта ${existingUser.id} на ${userFromToken.id}`);

    } catch (error) {
      this.logger.warn(`Ошибка верификации токена для существующего пользователя ${telegramId}: ${error.message}`);
      await this.sendInvalidTokenMessage(chatId);
    }
  }

  /**
   * Обрабатывает верификацию токена для нового пользователя (первоначальная привязка)
   * @param {number} telegramId - уникальный идентификатор пользователя в Telegram
   * @param {number} chatId - идентификатор чата для отправки ответов
   * @param {string} token - токен верификации из команды /start
   * @returns {Promise<void>}
   * @private
   */
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

  /**
   * Формирует и отправляет приветственное сообщение
   */
  private async sendWelcomeMessage(chatId: number, firstName: string): Promise<boolean> {
    const message = `👋 Добро пожаловать, ${firstName}!\n\n` + 
      `🤖 *Доступные команды:*\n\n` +
      `🔹 /start\n  - Начало работы с ботом\n\n` +
      `👤 /profile\n  - Просмотр профиля\n\n` + 
      `🏠 /listings *[страница]*\n  - Мои объявления\n\n` +
      `📅 /bookings *[роль]* *[страница]*\n  - Мои бронирования\n\n` +
      `🎫 /subscription\n  - Информация о подписке\n\n` +
      `💰 /wallet\n  - Баланс и транзакции\n\n` +
      `🆘 /help\n  - Помощь`;

    return this.sendMarkdownMessage(chatId, message);
  }

  /**
   * Формирует и отправляет инструкции по привязке
   */
  async sendBindingInstructions(chatId: number): Promise<boolean> {
    const message = `🔐 Для использования бота необходимо привязать аккаунт\n\n` + 
      `1. Откройте веб-приложение\n` + 
      `2. Перейдите в раздел "Настройки" → "Telegram"  \n` + 
      `3. Нажмите "Привязать аккаунт"\n` + 
      `4. Перейдите по полученной ссылке для активации\n\n` + 
      `🔑 После привязки вы получите доступ ко всем функциям бота.`;

    return this.sendMessage(chatId, message);
  }

  /**
   * Формирует и отправляет сообщение о невалидном токене
   */
  private async sendInvalidTokenMessage(chatId: number): Promise<boolean> {
    const message = `❌ Неверный или просроченный токен. Запросите новую ссылку в приложении.\n\n` +
      `1. Откройте веб-приложение\n` + 
      `2. Перейдите в раздел "Настройки" → "Telegram"  \n` + 
      `3. Нажмите "Привязать аккаунт"\n` + 
      `4. Перейдите по полученной ссылке для активации`;

    return this.sendMessage(chatId, message);
  }

  /**
   * Отправляет сообщение об успешной перепривязке
   */
  private async sendAccountRelinkedMessage(chatId: number, firstName: string): Promise<boolean> {
    const message = `🔄 Аккаунт успешно перепривязан! Добро пожаловать, ${firstName}!`;
    return this.sendMessage(chatId, message);
  }

  /**
   * Отправляет сообщение о том, что аккаунт уже привязан
   */
  private async sendAlreadyLinkedMessage(chatId: number): Promise<boolean> {
    const message = 'ℹ️ Ваш Telegram уже привязан к этому аккаунту.';
    return this.sendMessage(chatId, message);
  }
}
