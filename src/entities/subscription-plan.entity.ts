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

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'decimal', precision: 26, scale: 16 })
  price: number;

  @Column({
    type: 'enum',
    enum: CurrencyType,
    default: CurrencyType.RUB,
  })
  currency: CurrencyType;

  @Column()
  maxListings: number;

  @Column()
  prioritySearch: boolean;

  @Column()
  boostsPerMonth: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  extraFeatures: Record<string, string> | null;

  @CreateDateColumn()
  createdAt: Date;
}
