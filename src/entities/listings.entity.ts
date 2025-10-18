import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user_id: User;

  @Column({ type: 'enum', enum: ['garage', 'storage', 'parking'] })
  type: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 26, scale: 16 })
  price: number;

  @Column({ type: 'enum', enum: ['RUB', 'USD', 'USDT', 'ETH', 'TRX'], default: 'RUB' })
  currency: string;

  @Column({ type: 'geometry', srid: 4326, nullable: true })
  location: string;

  @Column()
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  size: number;

  @Column({ type: 'jsonb', nullable: true })
  photos_json: any;

  @Column({ type: 'jsonb', nullable: true })
  amenities: any;

  @Column({ type: 'tsrange', array: true, default: '{}' })
  availability: string[];

  @Column({ type: 'enum', enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'INACTIVE'], default: 'DRAFT' })
  status: string;

  @Column({ default: 0 })
  views_count: number;

  @Column({ default: 0 })
  reposts_count: number;

  @Column({ default: 0 })
  favorites_count: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}