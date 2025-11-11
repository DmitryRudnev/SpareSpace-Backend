import { ApiProperty } from '@nestjs/swagger';
import { ListingBaseResponseDto } from './listing-base-response.dto';
import { UserPublicResponseDto } from '../../../users/dto/user-public-response.dto';

export class ListingPublicResponseDto extends ListingBaseResponseDto {
  @ApiProperty({ type: UserPublicResponseDto, description: 'Пользователь, создавший объявление' })
  user: UserPublicResponseDto;
} 
