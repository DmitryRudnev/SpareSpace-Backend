import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { UserRole } from './user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  patronymic: string | null;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number | null;

  @Column({ default: false })
  twoFaEnabled: boolean;

  @Column({ default: false })
  verified: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  get roles(): UserRoleType[] {
    return this.userRoles?.map((userRole) => userRole.role) || [];
  }
}
