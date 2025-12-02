import { TelegramUser } from './telegram-user.interface';
import { TelegramMessage } from './telegram-message.interface';

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  chat_instance: string;
  message?: TelegramMessage;
  data?: string;
}
