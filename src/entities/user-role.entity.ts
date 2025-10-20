import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { UserRoleType } from '../common/enums/user-role-type.enum';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.user_roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: UserRoleType, enumName: 'user_role_type' })
  role: UserRoleType;

  @CreateDateColumn({ type: 'timestamptz' })
  assigned_at: Date;
}
