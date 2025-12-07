import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { ListingsService } from '../../../listings/listings.service';
import { TelegramBaseService } from './telegram-base.service';
import { TelegramSetupService } from '../telegram-setup.service';
import { SearchListingsDto } from '../../../listings/dto/requests/search-listings.dto';
import { ListingStatus } from '../../../common/enums/listing-status.enum';
import { CurrencyType } from '../../../common/enums/currency-type.enum';

@Injectable()
export class TelegramListingsHandlerService extends TelegramBaseService {
  constructor(
    telegramSetupService: TelegramSetupService,
    private readonly usersService: UsersService,
    private readonly listingsService: ListingsService,
  ) {
    super(telegramSetupService, TelegramListingsHandlerService.name);
  }

  async handle(telegramId: number, chatId: number, page: number = 1): Promise<void> {
    try {
      const searchDto: SearchListingsDto = {
        limit: 5,
        offset: (page - 1) * 5,
      };

      const user = await this.usersService.findByTelegramId(telegramId);
      const result = await this.listingsService.findByUser(user.id, searchDto, user.id);
      
      if (result.listings.length === 0) {
        await this.sendMessage(chatId, '📭 У вас пока нет объявлений');
        return;
      }

      let message = `🏠 *Ваши объявления* (стр. ${page})\n\n`;
      
      result.listings.forEach((listing, index) => {
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

      message += `Всего объявлений: ${result.total}`;

      await this.sendMarkdownMessage(chatId, message);
    } catch (error) {
      this.logger.error(`Ошибка получения объявлений: ${error.message}`);
      await this.sendMessage(chatId, '❌ Не удалось загрузить объявления');
    }
  }

  private isFiat(currency: CurrencyType): boolean {
    if (currency === CurrencyType.RUB || currency === CurrencyType.USD) {
      return true;
    }
    return false;
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
