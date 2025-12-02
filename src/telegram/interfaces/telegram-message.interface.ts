import { TelegramUser } from './telegram-user.interface';
import { TelegramChat } from './telegram-chat.interface';
import { TelegramMessageEntity } from './telegram-message-entity.interface';

export interface TelegramMessage {
  message_id: number;
  date: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
  entities?: TelegramMessageEntity[];
}
