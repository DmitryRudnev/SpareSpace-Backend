import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteConversationDto {
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Флаг полного удаления (true) или восстановления (false)',
    default: false,
    example: false
  })
  @IsOptional()
  @IsBoolean()
  permanent?: boolean = false;
}
