import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber } from 'class-validator';

export class CheckPhoneDto {
  @ApiProperty({ type: String, description: 'Телефон', example: '+78005553535' })
  @IsString()
  @IsPhoneNumber()
  phone: string;
}
