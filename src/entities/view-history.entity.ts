import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Listing } from './listings.entity';

@Entity('view_history')
export class ViewHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: true })
  user_id: User;

  @ManyToOne(() => Listing)
  listing_id: Listing;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  viewed_at: Date;
}