import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { SubscriptionsService } from '../../../subscriptions/subscriptions.service';
import { TelegramBaseService } from './telegram-base.service';
import { TelegramSetupService } from '../telegram-setup.service';
import { UserSubscription } from '../../../entities/user-subscription.entity';

@Injectable()
export class TelegramSubscriptionHandlerService extends TelegramBaseService {
  constructor(
    telegramSetupService: TelegramSetupService,
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    super(telegramSetupService, TelegramSubscriptionHandlerService.name);
  }

  async handle(telegramId: number, chatId: number): Promise<void> {
    try {
      const user = await this.usersService.findByTelegramId(telegramId);
      const subscription = await this.subscriptionsService.findActiveSubscription(user.id);

      if (!subscription) {
        await this.sendNoSubscriptionMessage(chatId);
        return;
      }

      const message = this.buildSubscriptionMessage(subscription);
      await this.sendMarkdownMessage(chatId, message);
    } catch (error) {
      this.logger.error(`Ошибка получения подписки: ${error.message}`);
      await this.sendMessage(chatId, '❌ Не удалось загрузить информацию о подписке');
    }
  }

  private buildSubscriptionMessage(subscription: UserSubscription): string {
    const plan = subscription.plan;
    const formattedPrice = this.isFiat(plan.currency) ? 
          Number(plan.price).toFixed(2) : 
          plan.price;
    const period = this.formatSubscriptionPeriod(subscription.startDate, subscription.endDate);
    const daysLeft = this.calculateDaysLeft(subscription.endDate);
    
    let message = `🎫 *Ваша текущая подписка*\n\n` +
      `📋 *План:* ${plan.name}\n` +
      `💰 *Стоимость:* ${formattedPrice} ${plan.currency}\n` +
      `🕒 *Период:* ${period}\n` +
      `${daysLeft}\n\n` +
      `⚡ *Возможности:*\n` +
      `• Объявления: ${plan.maxListings} шт.\n` +
      `• Приоритет в поиске: ${plan.prioritySearch ? '✅' : '❌'}\n` +
      `• Бусты в месяц: ${plan.boostsPerMonth} шт.\n`;

    if (plan.extraFeatures && Object.keys(plan.extraFeatures).length > 0) {
      message += `\n🎁 *Дополнительно:*\n`;
      Object.entries(plan.extraFeatures).forEach(([key, value]) => {
        message += `• ${key}: ${value}\n`;
      });
    }
    
    return message;
  }

  private isFiat(currency: string): boolean {
    const fiatCurrencies = ['RUB', 'USD'];
    return fiatCurrencies.includes(currency);
  }

  private formatSubscriptionPeriod(startDate: Date, endDate: Date | null): string {
    const start = new Date(startDate).toLocaleDateString('ru-RU');
    const end = endDate ? new Date(endDate).toLocaleDateString('ru-RU') : '∞';
    return `${start} - ${end}`;
  }

  private calculateDaysLeft(endDate: Date | null): string {
    if (!endDate) {
      return `♾️ *Бессрочная* подписка`;
    }
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `⏳ Осталось *${daysLeft}* ${this.getDaysWord(daysLeft)}`;
  }

  private getDaysWord(daysCount: number): string {
    const count100 = daysCount % 100;
    if (11 <= count100 && count100 <= 14)  return 'дней';
    
    const count = daysCount % 10;
    if (count === 1)  return 'день';
    if (2 <= count && count <= 4)  return 'дня';
    return 'дней';
  }

  private async sendNoSubscriptionMessage(chatId: number): Promise<void> {
    const message = `📭 *У вас нет активной подписки*\n\n` +
      `Для доступа к расширенным возможностям аренды рекомендуем оформить подписку.\n\n` +
      `💡 *Преимущества подписки:*\n` +
      `• Больше объявлений\n` +
      `• Приоритет в поиске\n` +
      `• Дополнительные бусты\n` +
      `• Расширенные статистики\n\n` +
      `Оформить подписку можно в веб-приложении в разделе "Подписки".`;

    await this.sendMarkdownMessage(chatId, message);
  }
}
