import { TelegramUser } from './telegram-user.interface';

export interface TelegramMessageEntity {
  type: string;
  offset: number;
  length: number;
}
