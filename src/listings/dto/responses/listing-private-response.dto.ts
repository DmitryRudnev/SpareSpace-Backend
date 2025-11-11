import { ApiProperty } from '@nestjs/swagger';
import { ListingBaseResponseDto } from './listing-base-response.dto';
import { ListingStatus } from '../../../common/enums/listing-status.enum';

export class ListingPrivateResponseDto extends ListingBaseResponseDto {
  @ApiProperty({ enum: ListingStatus, description: 'Статус объявления', example: ListingStatus.ACTIVE })
  status: ListingStatus;
} 
