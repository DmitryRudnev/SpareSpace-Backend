import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_devices')
@Index(['user', 'deviceId'], { unique: true })
export class UserDevice {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  deviceId: string;

  @Column({ type: 'text' })
  fcmToken: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  platform: string | null;
  
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
