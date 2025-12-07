// src/users/services/user-status.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserStatusService {
  private readonly logger = new Logger(UserStatusService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Установить пользователя онлайн
   */
  async setOnline(userId: number): Promise<void> {
    try {
      await this.userRepository.update(
        { id: userId },
        { 
          isOnline: true,
          lastSeenAt: new Date()
        }
      );
      this.logger.log(`User ${userId} is now online`);
    } catch (error) {
      this.logger.error(`Failed to set online status for user ${userId}:`, error);
      // В реальном проекте нужно бросить кастомную ошибку
      throw new Error(`Failed to set online status: ${error.message}`);
    }
  }

  /**
   * Установить пользователя оффлайн
   */
  async setOffline(userId: number): Promise<void> {
    try {
      await this.userRepository.update(
        { id: userId },
        { 
          isOnline: false,
          lastSeenAt: new Date()
        }
      );
      this.logger.log(`User ${userId} is now offline`);
    } catch (error) {
      this.logger.error(`Failed to set offline status for user ${userId}:`, error);
      throw new Error(`Failed to set offline status: ${error.message}`);
    }
  }

  /**
   * Обновить время последней активности
   */
  async updateLastSeen(userId: number): Promise<void> {
    try {
      await this.userRepository.update(
        { id: userId },
        { lastSeenAt: new Date() }
      );
    } catch (error) {
      this.logger.error(`Failed to update last seen for user ${userId}:`, error);
      throw new Error(`Failed to update last seen: ${error.message}`);
    }
  }

  /**
   * Получить текущий статус пользователя
   */
  async getUserStatus(userId: number): Promise<{ isOnline: boolean; lastSeenAt: Date }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'isOnline', 'lastSeenAt'],
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      return {
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt || new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get status for user ${userId}:`, error);
      throw new Error(`Failed to get user status: ${error.message}`);
    }
  }
}
