import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Модули приложения
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

// Сущности
import { User } from './entities/user.entity';
import { UserToken } from './entities/user-token.entity';
import { Listing } from './entities/listing.entity';
import { ViewHistory } from './entities/view-history.entity';
import { Booking } from './entities/booking.entity';
import { Review } from './entities/review.entity';
import { UserRole } from './entities/user-role.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { Transaction } from './entities/transaction.entity';
import { Notification } from './entities/notification.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN'),
          algorithm: 'HS256',
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [
          User, UserToken, Listing, ViewHistory, Booking, Review, UserRole,
          Wallet, WalletBalance, Transaction, Notification,
          SubscriptionPlan, UserSubscription,
        ],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ListingsModule,
    BookingsModule,
    ReviewsModule,
    UsersModule,
    WalletsModule,
    NotificationsModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}
