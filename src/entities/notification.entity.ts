import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { NotificationType } from '../common/enums/notification-type.enum';
import { NotificationChannel } from '../common/enums/notification-channel.enum';
import { NotificationStatus } from '../common/enums/notification-status.enum';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType, })
  type: NotificationType;

  @Column()
  content: string;

  @Column({ type: 'enum', enum: NotificationChannel, })
  channel: NotificationChannel;

  @Column({ default: false })
  is_sent: boolean;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.UNREAD, })
  status: NotificationStatus;

  @CreateDateColumn()
  created_at: Date;
}
