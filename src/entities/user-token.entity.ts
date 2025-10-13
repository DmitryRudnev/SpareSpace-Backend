import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_tokens')
export class UserToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  refresh_token: string;

  @Column({ type: 'timestamp' })
  expiry: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}