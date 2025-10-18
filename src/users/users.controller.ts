import { Controller, Get, Patch, Body, Param, UseGuards, Delete, Post } from '@nestjs/common';
import { UserService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRoleType } from '../entities/user-role.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @User('userId') currentUserId: number) {
    if (+id !== currentUserId) throw new UnauthorizedException('Access denied');
    return this.userService.findById(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @User('userId') currentUserId: number) {
    if (+id !== currentUserId) throw new UnauthorizedException('Access denied');
    return this.userService.update(+id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @Get(':id/roles')
  getRoles(@Param('id') id: string) {
    return this.userService.getUserRoles(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @Post(':id/roles')
  addRole(@Param('id') id: string, @Body('role') role: string) {
    return this.userService.addRole(+id, role as UserRoleType);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @Delete(':id/roles/:role')
  removeRole(@Param('id') id: string, @Param('role') role: string) {
    return this.userService.removeRole(+id, role as UserRoleType);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/rating')
  getRating(@Param('id') id: string, @User('userId') currentUserId: number) {
    if (+id !== currentUserId) throw new UnauthorizedException('Access denied');
    return this.userService.getAvgRating(+id);
  }
}