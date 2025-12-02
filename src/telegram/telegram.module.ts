import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ListingsModule } from '../listings/listings.module';
import { BookingsModule } from '../bookings/bookings.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { WalletsModule } from '../wallets/wallets.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TelegramAuthToken } from '../entities/telegram-auth-token.entity';
import { TelegramController } from './telegram.controller';

import { TelegramService } from './services/telegram.service';
import { TelegramSetupService } from './services/telegram-setup.service';
import { TelegramAccountService } from './services/telegram-account.service';
import { TelegramStartHandlerService } from './services/command-handlers/telegram-start-handler.service';
import { TelegramProfileHandlerService } from './services/command-handlers/telegram-profile-handler.service';
import { TelegramListingsHandlerService } from './services/command-handlers/telegram-listings-handler.service';
import { TelegramBookingsHandlerService } from './services/command-handlers/telegram-bookings-handler.service';
import { TelegramVerificationService } from './services/telegram-verification.service';
import { TelegramWalletHandlerService } from './services/command-handlers/telegram-wallet-handler.service';
import { TelegramSubscriptionHandlerService } from './services/command-handlers/telegram-subscription-handler.service';


@Module({
  imports: [
    ConfigModule,
    AuthModule, 
    UsersModule,
    ListingsModule,
    BookingsModule,
    ReviewsModule,
    WalletsModule,
    SubscriptionsModule,
    TypeOrmModule.forFeature([TelegramAuthToken])
  ],
  providers: [
    TelegramService,
    TelegramSetupService,
    TelegramAccountService,
    TelegramVerificationService,
    TelegramStartHandlerService,
    TelegramProfileHandlerService,
    TelegramListingsHandlerService,
    TelegramBookingsHandlerService,
    TelegramWalletHandlerService,
    TelegramSubscriptionHandlerService,
  ],
  controllers: [TelegramController],
  exports: [TelegramService, TelegramAccountService],
})
export class TelegramModule {}
