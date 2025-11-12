import { ApiProperty } from '@nestjs/swagger';
import { UserPublicResponseDto } from './user-public-response.dto';

export class UserPrivateResponseDto extends UserPublicResponseDto {
  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({ description: 'Телефон' })
  phone: string;

  @ApiProperty({ description: 'Включена ли двухфакторная аутентификация' })
  twoFaEnabled: boolean;
}
