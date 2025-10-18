import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_tokens')
export class UserToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ name: 'refresh_token_hash' })
  refresh_token_hash: string;

  @Column({ type: 'timestamp' })
  expiry: Date;

  @Column({ default: false })
  revoked: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}