import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Listing } from './listings.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing_id: Listing;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'renter_id' })
  renter_id: User;

  @Column({ type: 'tsrange' })
  period: string;

  @Column({ type: 'decimal', precision: 26, scale: 16 })
  price_total: number;

  @Column({ type: 'enum', enum: ['RUB', 'USD', 'USDT', 'ETH', 'TRX'], default: 'RUB' })
  currency: string;

  @Column({ type: 'enum', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'PENDING' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}