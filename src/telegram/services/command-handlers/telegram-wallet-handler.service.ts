import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../users/users.service';
import { WalletsService } from '../../../wallets/wallets.service';
import { TelegramBaseService } from './telegram-base.service';
import { TelegramSetupService } from '../telegram-setup.service';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { WalletBalance } from '../../../entities/wallet-balance.entity';
import { Transaction } from '../../../entities/transaction.entity';

@Injectable()
export class TelegramWalletHandlerService extends TelegramBaseService {
  constructor(
    telegramSetupService: TelegramSetupService,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
  ) {
    super(telegramSetupService, TelegramWalletHandlerService.name);
  }

  async handle(telegramId: number, chatId: number): Promise<void> {
    try {
      const user = await this.usersService.findByTelegramId(telegramId);
      const balances = await this.walletsService.getBalances(user.id, {});
      const transactions = await this.walletsService.findTransactionsByUserId(user.id);

      const message = this.buildWalletMessage(balances, transactions);
      await this.sendMarkdownMessage(chatId, message);
    } catch (error) {
      this.logger.error(`Ошибка получения кошелька: ${error.message}`);
      await this.sendMessage(chatId, '❌ Не удалось загрузить информацию о кошельке');
    }
  }

  private buildWalletMessage(balances: WalletBalance[], transactions: Transaction[]): string {
    let message = `💰 *Ваш кошелёк*\n\n`;

    // Секция балансов
    if (balances.length === 0) {
      message += `📭 *Баланс:* отсутсвует\n\n`;
    } else {
      message += `📊 *Баланс:*\n`;
      balances.forEach(balance => {
        const formattedBalance = this.isFiat(balance.currency) ? 
          Number(balance.balance).toFixed(2) : balance.balance;
        message += `• ${formattedBalance} ${balance.currency}\n`;
      });
      message += `\n`;
    }

    // Секция последних транзакций
    if (transactions.length === 0) {
      message += `📭 *Последние операции:* нет транзакций`;
    } else {
      message += `💳 *Последние операции:*\n`;
      transactions.forEach((transaction, index) => {
        const emoji = this.getTransactionEmoji(transaction.type);
        const typeText = this.getTypeText(transaction.type);
        const sign = transaction.type === TransactionType.TOPUP ? '+' : '-';
        const amount = this.isFiat(transaction.currency) ? 
          Number(transaction.amount).toFixed(2) : 
          transaction.amount;
        
        message += `${index + 1}. ${emoji} ${typeText}: ${sign}${amount} ${transaction.currency}\n`;
        if (transaction.description) {
          message += ` - ${transaction.description}`;
        }
        message += `\n   🗓 ${new Date(transaction.createdAt).toLocaleString('ru-RU')}\n\n`;
      });
    }

    return message;
  }

  private isFiat(currency: string): boolean {
    const fiatCurrencies = ['RUB', 'USD'];
    return fiatCurrencies.includes(currency);
  }

  private getTransactionEmoji(type: TransactionType): string {
    const emojiMap = {
      [TransactionType.TOPUP]: '🟢',
      [TransactionType.CHARGE]: '🔴',
      [TransactionType.PAYOUT]: '🟠',
    //   [TransactionType.REFUND]: '🟡',
    };
    return emojiMap[type] || '⚪';
  }

  private getTypeText(type: TransactionType): string {
    const typeMap = {
      [TransactionType.TOPUP]: 'Пополнение',
      [TransactionType.CHARGE]: 'Списание',
      [TransactionType.PAYOUT]: 'Вывод',
      [TransactionType.COMMISSION]: 'Комиссия',
    //   [TransactionType.REFUND]: 'Возврат',
    };
    return typeMap[type] || type;
  }
}
