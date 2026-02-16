import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MarkAsReadDto {
  @ApiPropertyOptional({
    type: [Number],
    description: 'Список ID уведомлений для массовой пометки "прочитано"',
    example: [1, 2, 3]
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  ids?: number[];
}
