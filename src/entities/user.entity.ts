import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  password_hash: string;

  @Column()
  full_name: string;

  @Column({ type: 'enum', enum: ['RENTER', 'LANDLORD', 'ADMIN'], default: 'RENTER' })
  role: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number;

  @Column({ default: false })
  two_fa_enabled: boolean;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}