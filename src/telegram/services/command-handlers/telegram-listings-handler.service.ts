import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { ListingsService } from '../../../listings/listings.service';
import { TelegramSenderService } from '../telegram-sender.service';
import { TelegramPaginationService } from '../telegram-pagination.service';
import { SearchListingsDto } from '../../../listings/dto/requests/search-listings.dto';
import { ListingStatus } from '../../../common/enums/listing-status.enum';
import { CurrencyType } from '../../../common/enums/currency-type.enum';


@Injectable()
export class TelegramListingsHandlerService {
  private readonly logger = new Logger(TelegramListingsHandlerService.name);

  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly paginationService: TelegramPaginationService,
    private readonly usersService: UsersService,
    private readonly listingsService: ListingsService,
  ) {}

  
  async handle(telegramId: number, chatId: number): Promise<void> {
    try {
      const user = await this.usersService.findByTelegramId(telegramId);
      const page = 1;
      await this.sendListingsPage(telegramId, chatId, page);
    } catch (error) {
      this.logger.error(`Ошибка получения объявлений: ${error.message}`);
      await this.telegramSenderService.sendMessage(chatId, '❌ Не удалось загрузить объявления');
    }
  }

  
  async sendListingsPage(
    telegramId: number,
    chatId: number,
    page: number,
    messageId?: number
  ): Promise<void> {
    try {
      // Валидация номера страницы
      if (page < 1) {
        throw new Error('Вы уже на первой странице');
      }

      const user = await this.usersService.findByTelegramId(telegramId);
      const listingCount = await this.listingsService.countUserListings(user.id);
      const totalPages = this.paginationService.calculateTotalPages(listingCount);
      
      // Проверяем, существует ли запрашиваемая страница
      if (page > totalPages && totalPages > 0) {
        throw new Error('Вы уже на последней странице');
      }

      // Получаем данные для страницы
      const searchDto: SearchListingsDto = {
        limit: this.paginationService.getItemsPerPage(),
        offset: (page - 1) * this.paginationService.getItemsPerPage(),
      };

      const result = await this.listingsService.findByUser(user.id, searchDto, user.id);
      
      if (result.listings.length === 0 && page > 1) {
        // Если страница пустая, но не первая - возвращаемся на первую
        page = 1;
        return this.sendListingsPage(telegramId, chatId, page, messageId);
      }
      
      if (result.listings.length === 0) {
        if (messageId) {
          await this.telegramSenderService.editMessageWithKeyboard(
            chatId,
            messageId,
            '📭 У вас пока нет объявлений',
            this.createEmptyKeyboard()
          );
        } else {
          await this.telegramSenderService.sendMessage(chatId, '📭 У вас пока нет объявлений');
        }
        return;
      }

      const message = this.buildListingsMessage(result.listings, page, result.total);
      const keyboard = this.paginationService.createPaginationKeyboard(page, totalPages, 'listings');

      if (messageId) {
        await this.telegramSenderService.editMessageWithKeyboard(chatId, messageId, message, keyboard);
      } else {
        await this.telegramSenderService.sendMessageWithKeyboard(chatId, message, keyboard);
      }
    } catch (error) {
      this.logger.error(`Ошибка получения объявлений: ${error.message}`);
      throw error; // Пробрасываем ошибку для обработки в TelegramService
    }
  }

  
  async handleCallback(
    chatId: number,
    messageId: number,
    page: number,
    telegramId: number
  ): Promise<void> {
    await this.sendListingsPage(telegramId, chatId, page, messageId);
  }

  
  private createEmptyKeyboard() {
    return { reply_markup: { inline_keyboard: [] } };
  }


  private buildListingsMessage(listings: any[], page: number, total: number): string {
    let message = `🏠 *Ваши объявления* (стр. ${page})\n\n`;
    
    listings.forEach((listing, index) => {
      const price = this.isFiat(listing.currency) ? Number(listing.price).toFixed(2)  : listing.price;
      message += `${index + 1}. *${listing.title}*\n` +
        `📊 Статус: ${this.getStatusEmoji(listing.status)} ${this.getStatusText(listing.status)}\n` +
        `💰 Цена: ${price} ${listing.currency} / ${listing.pricePeriod}\n` +
        `📍 Адрес: ${listing.address}\n` +
        `📝 Описание: ${this.getListingDescription(listing.description)}\n` +
        `👁️ Просмотры: ${listing.viewsCount}\n` +
        `🔄 Репосты: ${listing.repostsCount}\n` +
        `⭐ Избранные: ${listing.favoritesCount}\n\n`;
    });

    message += `Всего объявлений: ${total}`;
    return message;
  }


  private isFiat(currency: CurrencyType): boolean {
    return currency === CurrencyType.RUB || currency === CurrencyType.USD;
  }


  private getListingDescription(description: string | null): string {
    if (!description) {
      return 'Нет описания';
    }
    if (description.length > 100) {
      return description.substring(0, 100) + '...';
    }
    return description;
  }


  private getStatusEmoji(status: ListingStatus): string {
    const emojiMap = {
      [ListingStatus.DRAFT]: '📝',
      [ListingStatus.ACTIVE]: '✅',
      [ListingStatus.INACTIVE]: '❌',
    };
    return emojiMap[status] || '📄';
  }


  private getStatusText(status: ListingStatus): string {
    const statusMap = {
      [ListingStatus.DRAFT]: 'Черновик',
      [ListingStatus.ACTIVE]: 'Активно',
      [ListingStatus.INACTIVE]: 'Неактивно',
    };
    return statusMap[status] || status;
  }
}
