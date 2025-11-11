import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsEnum, IsOptional, Min, IsPositive } from 'class-validator';
import { BookingStatus } from '../../common/enums/booking-status.enum';

export class SearchBookingsDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'ID пользователя',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({
    enum: BookingStatus,
    description: 'Статус бронирования',
    example: BookingStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
  
  @ApiPropertyOptional({
    type: Number,
    description: 'Лимит записей',
    minimum: 1,
    default: 10,
    example: 10,
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
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number = 0;
}
