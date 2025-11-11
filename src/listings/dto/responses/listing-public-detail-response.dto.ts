import { ApiProperty } from '@nestjs/swagger';
import { ListingBaseDetailResponseDto } from './listing-base-detail-response.dto';
import { UserPublicResponseDto } from '../../../users/dto/user-public-response.dto';

export class ListingPublicDetailResponseDto extends ListingBaseDetailResponseDto {
  @ApiProperty({ type: UserPublicResponseDto, description: 'Пользователь, создавший объявление' })
  user: UserPublicResponseDto;
} 
