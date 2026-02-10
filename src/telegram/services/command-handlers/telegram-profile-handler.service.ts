import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { ReviewsService } from '../../../reviews/reviews.service';
import { TelegramSenderService } from '../telegram-sender.service';

@Injectable()
export class TelegramProfileHandlerService {
  private readonly logger = new Logger(TelegramProfileHandlerService.name);


  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly usersService: UsersService,
    private readonly reviewsService: ReviewsService,
  ) {}


  async handle(telegramId: number, chatId: number): Promise<void> {
    try {
      const user = await this.usersService.findByTelegramId(telegramId);
      const rating = await this.getRatingString(user.rating, user.id);

      const message = `📋 *Ваш профиль*\n\n` +
        `👤 Имя: ${user.firstName} ${user.lastName}\n` +
        `📞 Телефон: ${user.phone}\n` +
        `📧 Email: ${user.email}\n` +
        `⭐ Рейтинг: ${rating}\n` +
        `🔐 2FA: ${user.twoFaEnabled ? '🟢 Включена' : '🔴 Выключена'}\n` +
        `🆔 Верифицирован: ${user.verified ? '✅ Да' : '❌ Нет'}`;

      await this.telegramSenderService.sendMarkdownMessage(chatId, message);
    } catch (error) {
      this.logger.error(`Ошибка получения профиля: ${error.message}`);
      await this.telegramSenderService.sendMessage(chatId, '❌ He удалось загрузить профиль');
    }
  }


  private async getRatingString(rating: number | null, userId: number): Promise<string> {
    if (rating) {
      const reviewsCount = await this.reviewsService.getReviewsCountByUserId(userId);
      const reviewsWord = this.getReviewsWord(reviewsCount);
      return `${rating} (${reviewsCount} ${reviewsWord})`;
    }
    return "ещё нет оценок";
  }

  
  private getReviewsWord(reviewsCount: number): string {
    const reviewsWord = 'отзыв';
    const count100 = reviewsCount % 100;
    if (11 <= count100 && count100 <= 14)  return reviewsWord+'ов';
    
    const count = reviewsCount % 10;
    if (count === 1)  return reviewsWord;
    if (2 <= count && count <= 4)  return reviewsWord+'a';
    return reviewsWord+'ов';
  }
}
