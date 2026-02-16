import { Injectable, Logger } from '@nestjs/common';
import { Markup } from 'telegraf';
import { UsersService } from '../../../users/services/users.service';
import { BookingsService } from '../../../bookings/bookings.service';
import { TelegramSenderService } from '../telegram-sender.service';
import { SearchBookingsDto } from '../../../bookings/dto/requests/search-bookings.dto';
import { UserRoleType } from '../../../common/enums/user-role-type.enum';
import { BookingStatus } from '../../../common/enums/booking-status.enum';
import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';
import { TelegramPaginationService } from '../telegram-pagination.service';

@Injectable()
export class TelegramBookingsHandlerService {
  private readonly logger = new Logger(TelegramBookingsHandlerService.name);


  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly paginationService: TelegramPaginationService,
    private readonly usersService: UsersService,
    private readonly bookingsService: BookingsService,
  ) {}


  async handle(telegramId: number, chatId: number): Promise<void> {
    try {
      await this.sendRoleSelection(chatId);
    } catch (error) {
      this.logger.error(`Ошибка при запуске хендлера бронирований: ${error.message}`);
      await this.telegramSenderService.sendMessage(chatId, '❌ Произошла ошибка');
    }
  }

  
  async sendRoleSelection(chatId: number): Promise<void> {
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('📤 Вы арендуете', 'bookings:role:renter'),
        Markup.button.callback('📥 Вы сдаёте в аренду', 'bookings:role:landlord'),
      ],
    ]);

    await this.telegramSenderService.sendMessageWithKeyboard(
      chatId,
      '📅 *Мои бронирования*\n\nВыберите категорию бронирований:',
      keyboard
    );
  }

  
  async sendBookingsPage(
    telegramId: number,
    chatId: number,
    role: UserRoleType,
    page: number,
    messageId?: number
  ): Promise<void> {
    try {
      const user = await this.usersService.findByTelegramId(telegramId);
      
      const totalBookingsCount = await this.bookingsService.countByRole(user.id, role);
      const totalPages = this.paginationService.calculateTotalPages(totalBookingsCount);

      // Валидация страницы
      if (page < 1 || (page > totalPages && totalPages > 0)) {
         // Можно выбросить ошибку или просто не обновлять сообщение
         return; 
      }

      if (totalBookingsCount === 0) {
        const emptyText = role === UserRoleType.LANDLORD 
          ? '📭 Вы ничего не сдавали в аренду.' 
          : '📭 Вы ничего не арендовали.';
        
        if (messageId) {
          // Если это обновление существующего сообщения, убираем кнопки
          await this.telegramSenderService.editMessageWithKeyboard(chatId, messageId, emptyText, 
            { 
              reply_markup: { inline_keyboard: [] } 
            });
        } else {
          await this.telegramSenderService.sendMessage(chatId, emptyText);
        }
        return;
      }

      
      const searchDto: SearchBookingsDto = {
        userRole: role,
        limit: this.paginationService.getItemsPerPage(),
        offset: (page - 1) * this.paginationService.getItemsPerPage(),
      };
      const result = await this.bookingsService.findAll(searchDto, user.id);

      const message = this.buildBookingsMessage(result.bookings, page, result.total, role);
      
      // Создаем клавиатуру пагинации, передавая роль в поле 'extra'
      const roleStr = role === UserRoleType.LANDLORD ? 'landlord' : 'renter';
      const keyboard = this.paginationService.createPaginationKeyboard(page, totalPages, 'bookings', roleStr);

      if (messageId) {
        await this.telegramSenderService.editMessageWithKeyboard(chatId, messageId, message, keyboard);
      } else {
        await this.telegramSenderService.sendMessageWithKeyboard(chatId, message, keyboard);
      }

    } catch (error) {
      this.logger.error(`Ошибка получения бронирований: ${error.message}`);
      if (!messageId) {
        await this.telegramSenderService.sendMessage(chatId, '❌ Не удалось загрузить бронирования');
      }
    }
  }

  
  private buildBookingsMessage(bookings: any[], page: number, total: number, role: UserRoleType): string {
    const roleTitle = role === UserRoleType.LANDLORD ? 'Вы сдаёте в аренду' : 'Вы арендуете';
    let message = `📅 *${roleTitle}* (стр. ${page})\n\n`;

    bookings.forEach((booking, index) => {
      const formattedPrice = this.isFiat(booking.currency) ? Number(booking.totalPrice).toFixed(2) : booking.totalPrice;
      const formattedPeriod = this.formatPeriod(booking.period, booking.listing.pricePeriod);
      
      const isLandlordView = role === UserRoleType.LANDLORD;
      const otherParty = isLandlordView ? 
        `👤 Арендатор: ${booking.renter.firstName} ${booking.renter.lastName}` :
        `👤 Владелец: ${booking.listing.user.firstName} ${booking.listing.user.lastName}`;

      message += `${index + 1}. *${booking.listing.title}*\n` +
        `💰 Цена: ${formattedPrice} ${booking.currency}\n` +
        `🕒 Период: ${formattedPeriod}\n` +
        `📊 Статус: ${this.getStatusText(booking.status)}\n` +
        `${otherParty}\n\n`;
    });

    message += `Всего: ${total}`;
    return message;
  }

  
  private isFiat(currency: CurrencyType): boolean {
    return currency === CurrencyType.RUB || currency === CurrencyType.USD;
  }


  private formatPeriod(period: string, pricePeriod: ListingPeriodType): string {
    try {
      const matches = period.match(/\[(.*),(.*)\)/);
      if (matches) {
        const startDate = new Date(matches[1]);
        const endDate = new Date(matches[2]);

        if (pricePeriod === ListingPeriodType.HOUR) {
          return `${startDate.toLocaleString('ru-RU')} - ${endDate.toLocaleString('ru-RU')}`;    
        }
        return `${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`;
      }
      return period;
    } catch {
      return period;
    }
  }

  
  private getStatusText(status: BookingStatus): string {
    const statusMap = {
      [BookingStatus.PENDING]: '⏳ Ожидание',
      [BookingStatus.CONFIRMED]: '✅ Подтверждено',
      [BookingStatus.COMPLETED]: '📦 Завершено',
      [BookingStatus.CANCELLED]: '❌ Отменено'
    };
    return statusMap[status] || status;
  }
}
