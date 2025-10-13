import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { Listing } from '../entities/listings.entity';
import { User } from '../entities/user.entity';
import { ViewHistory } from '../entities/view-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing, User, ViewHistory]),
    PassportModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}