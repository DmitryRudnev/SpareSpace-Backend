import { SetMetadata } from '@nestjs/common';
import { UserRoleType } from '../enums/user-role-type.enum';

export const Roles = (...roles: UserRoleType[]) => SetMetadata('roles', roles);
