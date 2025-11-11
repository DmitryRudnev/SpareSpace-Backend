import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingBaseDetailResponseDto } from './listing-base-detail-response.dto';
import { ListingStatus } from '../../../common/enums/listing-status.enum';

export class ListingPrivateDetailResponseDto extends ListingBaseDetailResponseDto {
  @ApiProperty({ enum: ListingStatus, description: 'Статус объявления', example: ListingStatus.ACTIVE })
  status: ListingStatus;
} 
