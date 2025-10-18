import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserRoleType } from '../entities/user-role.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepository: Repository<UserRole>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userRoles'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOneBy({ email });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async getUserRoles(id: number): Promise<string[]> {
    const roles = await this.userRoleRepository.find({
      where: { user_id: id },
      select: ['role'],
    });
    return roles.map(r => r.role);
  }

  async addRole(id: number, role: UserRoleType): Promise<void> {
    const existing = await this.userRoleRepository.findOneBy({ user_id: id, role });
    if (existing) return;

    const userRole = this.userRoleRepository.create({ user_id: id, role });
    await this.userRoleRepository.save(userRole);
  }

  async removeRole(id: number, role: UserRoleType): Promise<void> {
    await this.userRoleRepository.delete({ user_id: id, role });
  }

  async getAvgRating(id: number): Promise<number> {
    const user = await this.findById(id);
    return user.rating || 0;
  }

  async hasRole(userId: number, requiredRole: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(requiredRole);
  }
}