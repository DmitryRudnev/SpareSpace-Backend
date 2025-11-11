import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, Validate, ValidateIf } from 'class-validator';

export class UpdateBookingDto {
  @ApiPropertyOptional({
    type: Date,
    description: 'Дата начала бронирования',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    type: Date,
    description: 'Дата окончания бронирования',
    example: '2024-01-10T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
