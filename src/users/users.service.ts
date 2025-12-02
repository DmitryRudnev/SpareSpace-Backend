import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { UpdateUserDto } from './dto/requests/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) 
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole) 
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  /**
   * Finds user by ID
   * @param userId - User ID to find
   * @returns User entity
   * @throws NotFoundException if user not found
   */
  async findById(userId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
  
  /**
   * Finds user by telegram ID
   * @param telegramId - Telegram ID to find
   * @returns User entity
   * @throws NotFoundException if user not found
   */
  async findByTelegramId(telegramId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ telegramId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Updates user profile data
   * @param userId - User ID to update
   * @param dto - Update data
   * @returns Updated user entity
   * @throws ConflictException if email or phone already exists
   */
  async update(userId: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);
    
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
    if (dto.patronymic !== undefined) {
      user.patronymic = dto.patronymic;
    }
    if (dto.phone !== undefined) { 
      const phoneExists = await this.userRepository.findOneBy({ phone: dto.phone });
      if (phoneExists && phoneExists.id !== userId) {
        throw new ConflictException('Phone already exists');
      }
      user.phone = dto.phone;
    }
    if (dto.email !== undefined) {
      const emailExists = await this.userRepository.findOneBy({ email: dto.email });
      if (emailExists && emailExists.id !== userId) {
        throw new ConflictException('Email already exists');
      }
      user.email = dto.email;
    }
    
    return this.userRepository.save(user);
  }

  /**
   * Updates user telegram ID
   * @param userId - User ID to update
   * @param newTelegramId - Update telegram ID
   * @returns Updated user entity
   */
  async updateTelegramId(userId: number, newTelegramId: number | null): Promise<User> {
    const user = await this.findById(userId);
    user.telegramId = newTelegramId;
    return this.userRepository.save(user);
  }

  /**
   * Retrieves all roles assigned to user
   * @param userId - User ID
   * @returns Array of user roles
   */
  async getUserRoles(userId: number): Promise<UserRoleType[]> {
    const roles = await this.userRoleRepository.find({
      where: { user: { id: userId } },
      select: ['role']
    });
    return roles.map((userRole) => userRole.role);
  }

  /**
   * Checks if user has specific role
   * @param userId - User ID
   * @param role - Role to check
   * @returns Boolean indicating role presence
   */
  async hasRole(userId: number, role: UserRoleType): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(role);
  }

  /**
   * Adds role to user
   * @param userId - User ID
   * @param role - Role to add
   * @throws ConflictException if role already exists
   */
  async addRole(userId: number, role: UserRoleType): Promise<void> {
    const roleExists = await this.hasRole(userId, role);
    if (roleExists) {
      throw new ConflictException(`Role ${role} already exists for user`);
    }
    const userRole = this.userRoleRepository.create({ 
      user: { id: userId }, 
      role 
    });
    await this.userRoleRepository.save(userRole);
  }

  /**
   * Removes role from user
   * @param userId - User ID
   * @param role - Role to remove
   */
  async removeRole(userId: number, role: UserRoleType): Promise<void> {
    await this.userRoleRepository.delete({ 
      user: { id: userId }, 
      role 
    });
  }
}
