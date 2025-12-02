import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

/**
 * Сервис для настройки и конфигурации Telegram бота
 * Отвечает за инициализацию бота, установку вебхука и управление его состоянием
 * @class
 * @public
 * @implements {OnModuleInit}
 */
@Injectable()
export class TelegramSetupService implements OnModuleInit {
  private readonly logger = new Logger(TelegramSetupService.name);
  private readonly bot: Telegraf;
  private botUsername: string;


  /**
   * Создает экземпляр сервиса настройки Telegram бота
   * Инициализирует экземпляр Telegraf с токеном из конфигурации
   * @param {ConfigService} configService - сервис для работы с конфигурацией приложения
   * @throws {Error} если TELEGRAM_BOT_TOKEN не настроен в конфигурации
   */
  constructor(private configService: ConfigService) {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN не настроен в конфигурации');
    }

    this.bot = new Telegraf(botToken);
  }

  /**
   * Метод жизненного цикла NestJS, вызываемый после инициализации модуля
   * Автоматически настраивает вебхук при запуске приложения
   * @returns {Promise<void>}
   */
  async onModuleInit() {
    await this.setupWebhook();
    await this.initializeBotUsername();
    await this.setBotCommands();
  }

  /**
   * Настраивает вебхук для получения обновлений от Telegram API
   * Создает URL вебхука на основе APP_URL и устанавливает его в Telegram API
   * @returns {Promise<boolean>} true если вебхук успешно установлен, false в случае ошибки
   * @throws {Error} если APP_URL или TELEGRAM_WEBHOOK_TOKEN не настроены в конфигурации
   */
  async setupWebhook(): Promise<boolean> {
    try {
      const appUrl = this.configService.get<string>('APP_URL');
      const secretToken = this.configService.get<string>('TELEGRAM_WEBHOOK_TOKEN');

      if (!appUrl) {
        throw new Error('APP_URL не настроен в конфигурации');
      }

      if (!secretToken) {
        throw new Error('TELEGRAM_WEBHOOK_TOKEN не настроен в конфигурации');
      }

      const webhookUrl = `${appUrl}/telegram/webhook`;
      
      const result = await this.bot.telegram.setWebhook(webhookUrl, {
        secret_token: secretToken,
      });

      if (result) {
        this.logger.log(`Вебхук успешно установлен: ${webhookUrl}`);
        const webhookInfo = await this.bot.telegram.getWebhookInfo();
        this.logger.log('Информация о вебхуке:', {
          url: webhookInfo.url,
          hasCustomCertificate: webhookInfo.has_custom_certificate,
          pendingUpdateCount: webhookInfo.pending_update_count,
        });
      } else {
        this.logger.error('Не удалось установить вебхук');
      }

      return result;
    } catch (error) {
      this.logger.error('Ошибка при установке вебхука:', error);
      return false;
    }
  }

  /**
   * Инициализирует username бота через Telegram API
   * @returns {Promise<void>}
   * @throws {Error} Если не удалось получить username бота
   */
  private async initializeBotUsername(): Promise<void> {
    try {
      const botInfo = await this.bot.telegram.getMe();
      this.botUsername = botInfo.username;
      this.logger.log(`Username бота инициализирован: @${this.botUsername}`);
    } catch (error) {
      this.logger.error('Не удалось получить username бота:', error);
      throw new Error('Ошибка инициализации бота: не удалось получить username');
    }
  }

  /**
   * Получает текущую информацию о настроенном вебхуке из Telegram API
   * @returns {Promise<object|null>} объект с информацией о вебхуке или null в случае ошибки
   */
  async getWebhookInfo(): Promise<object | null> {
    try {
      return await this.bot.telegram.getWebhookInfo();
    } catch (error) {
      this.logger.error('Ошибка при получении информации о вебхуке:', error);
      return null;
    }
  }

  /**
   * Удаляет текущий вебхук из Telegram API
   * Используется для перехода на long-polling или сброса конфигурации
   * @returns {Promise<boolean>} true если вебхук успешно удален, false в случае ошибки
   */
  async deleteWebhook(): Promise<boolean> {
    try {
      return await this.bot.telegram.deleteWebhook();
    } catch (error) {
      this.logger.error('Ошибка при удалении вебхука:', error);
      return false;
    }
  }

  /**
   * Возвращает экземпляр Telegraf бота для использования в других сервисах
   * @returns {Telegraf} экземпляр Telegraf бота
   */
  getBotInstance(): Telegraf {
    return this.bot;
  }

  /**
   * Возвращает username бота
   * @returns {string} Username бота без символа @
   * @throws {Error} Если username бота не был инициализирован
   */
  getBotUsername(): string {
    if (!this.botUsername) {
      throw new Error('Username бота не инициализирован');
    }
    return this.botUsername;
  }

  /**
   * Устанавливает подсказки команд для бота
   */
  async setBotCommands(): Promise<void> {
    try {
      await this.bot.telegram.setMyCommands([
        {
          command: 'start',
          description: '🚀 Начало работы с ботом',
        },
        {
          command: 'profile', 
          description: '👤 Просмотр профиля',
        },
        {
          command: 'listings',
          description: '🏠 Мои объявления',
        },
        {
          command: 'bookings',
          description: '📅 Мои бронирования',
        },
        {
          command: 'subscription',
          description: '🎫 Информация о подписке',
        },
        {
          command: 'wallet',
          description: '💰 Баланс и транзакции',
        },
        {
          command: 'help',
          description: '🆘 Помощь и список команд',
        },
      ], {
        language_code: 'ru', // для русскоязычных пользователей
        // scope: { type: 'all_private_chats' } // опционально: только для приватных чатов
      });

      this.logger.log('Bot commands set successfully');
    } catch (error) {
      this.logger.error(`Failed to set bot commands: ${error.message}`);
    }
  }
}
