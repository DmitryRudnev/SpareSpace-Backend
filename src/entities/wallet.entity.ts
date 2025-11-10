import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
