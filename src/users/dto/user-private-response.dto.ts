import { ApiProperty } from '@nestjs/swagger';
import { UserPublicResponseDto } from './user-public-response.dto';

export class UserPrivateResponseDto extends UserPublicResponseDto {
  @ApiProperty({ type: 'string', description: 'Email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ type: 'string', description: 'Телефон', example: '+79161234567' })
  phone: string;

  @ApiProperty({ type: 'boolean', description: 'Включена ли двухфакторная аутентификация', example: false })
  twoFaEnabled: boolean;
}
