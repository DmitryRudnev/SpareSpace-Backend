import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Listing } from './listings.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing_id: Listing;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'from_user_id' })
  from_user_id: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'to_user_id' })
  to_user_id: User;

  @Column({ type: 'int', check: "rating >= 1 AND rating <= 5" })
  rating: number;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}