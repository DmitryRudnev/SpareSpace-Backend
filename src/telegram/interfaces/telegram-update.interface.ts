import { TelegramMessage } from './telegram-message.interface';
import { TelegramCallbackQuery } from './telegram-callback-query.interface';

export interface TelegramWebhookUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}
