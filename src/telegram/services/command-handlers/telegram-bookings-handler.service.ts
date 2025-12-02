import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../users/users.service';
import { BookingsService } from '../../../bookings/bookings.service';
import { TelegramBaseService } from './telegram-base.service';
import { TelegramSetupService } from '../telegram-setup.service';
import { SearchBookingsDto } from '../../../bookings/dto/requests/search-bookings.dto';
import { UserRoleType } from '../../../common/enums/user-role-type.enum';
import { BookingStatus } from '../../../common/enums/booking-status.enum';
import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';

@Injectable()
export class TelegramBookingsHandlerService extends TelegramBaseService {
  constructor(
    telegramSetupService: TelegramSetupService,
    private readonly usersService: UsersService,
    private readonly bookingsService: BookingsService,
  ) {
    super(telegramSetupService, TelegramBookingsHandlerService.name);
  }

  async handle(telegramId: number, chatId: number, role: string = 'all', page: number = 1): Promise<void> {
    try {
      const searchDto: SearchBookingsDto = {
        userRole: role === 'landlord' ? UserRoleType.LANDLORD : 
                  role === 'renter' ? UserRoleType.RENTER : undefined,
        limit: 5,
        offset: (page - 1) * 5,
      };

      const user = await this.usersService.findByTelegramId(telegramId);
      const result = await this.bookingsService.findAll(searchDto, user.id);
      
      if (result.bookings.length === 0) {
        const roleText = role === 'landlord' ? 'как у арендодателя' : 
                         role === 'renter' ? 'как у арендатора' : '';
        await this.sendMessage(chatId, `📭 У вас пока нет бронирований ${roleText}`);
        return;
      }

      let message = `📅 *Ваши бронирования* (стр. ${page})\n\n`;
      
      result.bookings.forEach((booking, index) => {
        const formattedPrice = this.isFiat(booking.currency) ? Number(booking.totalPrice).toFixed(2) : booking.totalPrice;
        const formattedPeriod = this.formatPeriod(booking.period, booking.listing.pricePeriod);
        const isLandlord = booking.listing.user.id === user.id;
        const otherParty = isLandlord ? 
          `Арендатор: ${booking.renter.firstName} ${booking.renter.lastName}` :
          `Арендодатель: ${booking.listing.user.firstName} ${booking.listing.user.lastName}`;

        message += `${index + 1}. *${booking.listing.title}* ` +
          `(${isLandlord ? 'У BAC арендуют' : 'ВЫ арендуете'})\n` +
          `💰 Цена: ${formattedPrice} ${booking.currency}\n` +
          `🕒 Период: ${formattedPeriod}\n` +
          `📊 Статус: ${this.getStatusText(booking.status)}\n` +
          `👤 ${otherParty}\n\n`;
      });

      message += `Всего бронирований: ${result.total}`;

      await this.sendMarkdownMessage(chatId, message);
    } catch (error) {
      this.logger.error(`Ошибка получения бронирований: ${error.message}`);
      await this.sendMessage(chatId, '❌ Не удалось загрузить бронирования');
    }
  }

  private isFiat(currency: CurrencyType): boolean {
    if (currency === CurrencyType.RUB || currency === CurrencyType.USD) {
      return true;
    }
    return false;
  }

  private formatPeriod(period: string, pricePeriod: ListingPeriodType): string {
    try {
      const matches = period.match(/\[(.*),(.*)\)/);
      if (matches) {
        const startDate = new Date(matches[1]);
        const endDate = new Date(matches[2]);
        
        if (pricePeriod === ListingPeriodType.HOUR) {
          const start = startDate.toLocaleString('ru-RU');
          const end = endDate.toLocaleString('ru-RU');
          return `${start} - ${end}`;    
        }

        const start = startDate.toLocaleDateString('ru-RU');
        const end = endDate.toLocaleDateString('ru-RU');
        return `${start} - ${end}`;
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
    //   [BookingStatus.ACTIVE]: '🔵 Активно',
      [BookingStatus.COMPLETED]: '📦 Завершено',
      [BookingStatus.CANCELLED]: '❌ Отменено'
    };
    return statusMap[status] || status;
  }
}
