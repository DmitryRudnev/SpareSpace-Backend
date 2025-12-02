import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TelegramAuthToken } from '../../entities/telegram-auth-token.entity';
import { User } from '../../entities/user.entity';
import * as crypto from 'crypto';

/**
 * Сервис для управления токенами верификации Telegram
 * Отвечает за генерацию, проверку и валидацию токенов для привязки Telegram аккаунтов
 * @class
 * @public
 */
@Injectable()
export class TelegramVerificationService {
  /**
   * Создает экземпляр сервиса верификации Telegram токенов
   * @param {Repository<TelegramAuthToken>} tokenRepository - репозиторий для работы с токенами верификации в БД
   */
  constructor(
    @InjectRepository(TelegramAuthToken)
    private tokenRepository: Repository<TelegramAuthToken>,
  ) {}

  /**
   * Генерирует уникальный токен верификации для привязки Telegram аккаунта
   * Создает криптографически безопасный токен длиной 64 символа (32 байта в hex)
   * Токен действителен в течение 10 минут
   * @param {number} userId - идентификатор пользователя, для которого генерируется токен
   * @returns {Promise<string>} сгенерированный токен верификации
   * @throws {Error} если не удалось сгенерировать уникальный токен за 3 попытки
   */
  async generateToken(userId: number): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const token = crypto.randomBytes(32).toString('hex');
      if (await this.isTokenActive(token)) {
        continue;
      }
      await this.tokenRepository.insert({
          token,
          user: { id: userId },
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 минут
        });
      return token;
    }
    throw new Error('Не удалось сгенерировать уникальный токен');
  }

  /**
   * Проверяет активность токена верификации
   * Токен считается активным если он не использован и не истек его срок действия
   * @param {string} token - токен для проверки
   * @returns {Promise<boolean>} true если токен активен, false если неактивен
   */
  async isTokenActive(token: string): Promise<boolean> {
    return this.tokenRepository.exists({
      where: {
        token,
        used: false,
        expiresAt: MoreThan(new Date())
      }
    });  
  }

  /**
   * Верифицирует токен и привязывает Telegram ID к пользователю
   * Проверяет что токен существует, не использован и не истек
   * После успешной верификации помечает токен как использованный
   * @param {string} token - токен верификации из команды /start
   * @param {number} telegramId - уникальный идентификатор пользователя в Telegram
   * @returns {Promise<User>} объект пользователя, который получал ссылку в приложении
   * @throws {NotFoundException} если токен не найден, уже использован или истек
   */
  async verifyToken(token: string, telegramId: number): Promise<User> {
    const verificationCode = await this.tokenRepository.findOne({
      where: {
        token,
        used: false,
        expiresAt: MoreThan(new Date())
      },
      relations: ['user']
    });

    if (!verificationCode) {
      throw new NotFoundException('Неверный или просроченный код');
    }

    verificationCode.used = true;
    verificationCode.telegramId = telegramId;
    await this.tokenRepository.save(verificationCode);

    return verificationCode.user;
  }
}
