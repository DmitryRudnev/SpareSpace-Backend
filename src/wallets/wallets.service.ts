import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { Transaction } from '../entities/transaction.entity';
import { GetBalancesDto } from './dto/get-balances.dto';
import { TopupDto } from './dto/topup.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { CurrencyType } from '../common/enums/currency-type.enum';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletBalance) private balanceRepository: Repository<WalletBalance>,
    @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  private async getOrCreateWallet(userId: number): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({ 
      where: { user: { id: userId } }, 
      relations: ['user'] 
    });
    if (!wallet) {
      wallet = this.walletRepository.create({ user: { id: userId} });
      wallet = await this.walletRepository.save(wallet);
    }
    return wallet;
  }

  private async getOrCreateBalance(wallet: Wallet, currency: CurrencyType): Promise<WalletBalance> {
    let balance = await this.balanceRepository.findOne({ 
      where: { 
        wallet: { id: wallet.id }, 
        currency 
      }});
    if (!balance) {
      balance = this.balanceRepository.create({ wallet, currency, balance: 0 });
      balance = await this.balanceRepository.save(balance);
    }
    return balance;
  }

  async getWalletByUserId(userId: number): Promise<Wallet> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet;
  }

  async getBalances(userId: number, dto: GetBalancesDto): Promise<WalletBalance[]> {
    const wallet = await this.getOrCreateWallet(userId);
    const where: any = { wallet: { id: wallet.id } };
    if (dto.currency) {
      where.currency = dto.currency;
    }
    return this.balanceRepository.find({ where });
  }

  async findTransactionsByUserId(userId: number, limit: number = 5, offset: number = 0): Promise<Transaction[]> {
    const wallet = await this.getOrCreateWallet(userId);
    return this.transactionRepository.find({
      where: { wallet: { id: wallet.id } },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
      relations: ['booking'],
    });
  }

  async topup(userId: number, dto: TopupDto): Promise<Transaction> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.getOrCreateWallet(userId);
      const balance = await this.getOrCreateBalance(wallet, dto.currency);
      balance.balance = +balance.balance + dto.amount;
      await manager.save(balance);

      const transaction = manager.create(Transaction, {
        wallet,
        type: TransactionType.TOPUP,
        amount: dto.amount,
        currency: dto.currency,
        status: PaymentStatus.COMPLETED,
        description: `Topup via ${dto.method}`,
        gatewayTransactionId: dto.gatewayTransactionId,
      });
      return manager.save(transaction);
    });
  }

  async withdraw(userId: number, dto: WithdrawDto): Promise<Transaction> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.getOrCreateWallet(userId);
      const balance = await this.getOrCreateBalance(wallet, dto.currency);
      if (+balance.balance < dto.amount) {
        throw new BadRequestException('Insufficient balance');
      }
      balance.balance = +balance.balance - dto.amount;
      await manager.save(balance);

      const transaction = manager.create(Transaction, {
        wallet,
        type: TransactionType.PAYOUT,
        amount: -dto.amount,
        currency: dto.currency,
        status: PaymentStatus.COMPLETED,
        description: `Withdraw to ${dto.destination}`,
      });
      return manager.save(transaction);
    });
  }

  async transfer(userId: number, dto: TransferDto): Promise<{ fromTransaction: Transaction; toTransaction: Transaction }> {
    await this.usersService.findById(dto.toUserId);

    return this.dataSource.transaction(async (manager) => {
      const fromWallet = await this.getOrCreateWallet(userId);
      const fromBalance = await this.getOrCreateBalance(fromWallet, dto.currency);
      if (+fromBalance.balance < dto.amount) {
        throw new BadRequestException('Insufficient balance');
      }
      fromBalance.balance = +fromBalance.balance - dto.amount;
      await manager.save(fromBalance);

      const toWallet = await this.getOrCreateWallet(dto.toUserId);
      const toBalance = await this.getOrCreateBalance(toWallet, dto.currency);
      toBalance.balance = +toBalance.balance + dto.amount;
      await manager.save(toBalance);

      const fromTransaction = manager.create(Transaction, {
        wallet: fromWallet,
        type: TransactionType.CHARGE,
        amount: -dto.amount,
        currency: dto.currency,
        status: PaymentStatus.COMPLETED,
        booking: undefined,
        description: dto.description || `Transfer to user ${dto.toUserId}`,
      });
      const toTransaction = manager.create(Transaction, {
        wallet: toWallet,
        type: TransactionType.TOPUP,
        amount: dto.amount,
        currency: dto.currency,
        status: PaymentStatus.COMPLETED,
        booking: undefined,
        description: dto.description || `Transfer from user ${userId}`,
      });

      await manager.save([fromTransaction, toTransaction]);
      return { fromTransaction, toTransaction };
    });
  }
}
