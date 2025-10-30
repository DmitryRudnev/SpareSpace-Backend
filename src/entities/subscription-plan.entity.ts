import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { CurrencyType } from '../common/enums/currency-type.enum';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column('decimal', { precision: 26, scale: 16 })
  price: number;

  @Column({
    type: 'enum',
    enum: CurrencyType,
    default: CurrencyType.RUB,
  })
  currency: CurrencyType;

  @Column({ default: 0 })
  max_listings: number;

  @Column({ default: false })
  priority_search: boolean;

  @Column({ default: 0 })
  boosts_per_month: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: {} })
  extra_features: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
