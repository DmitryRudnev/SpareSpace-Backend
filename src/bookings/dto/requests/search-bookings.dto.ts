import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsEnum, IsOptional, Min } from 'class-validator';
import { BookingStatus } from '../../../common/enums/booking-status.enum';
import { UserRoleType } from '../../../common/enums/user-role-type.enum';

export class SearchBookingsDto {
  @ApiPropertyOptional({
    enum: BookingStatus,
    description: 'Статус бронирования',
    example: BookingStatus.CONFIRMED
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    enum: UserRoleType,
    description: 'Роль пользователя в бронировании',
    example: UserRoleType.RENTER,
  })
  @IsOptional()
  @IsEnum(UserRoleType)
  userRole?: UserRoleType;
  
  @ApiPropertyOptional({
    type: Number,
    description: 'Лимит записей',
    minimum: 1,
    default: 10,
    example: 10
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({
    type: Number,
    description: 'Смещение',
    minimum: 0,
    default: 0,
    example: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number = 0;
}
