import { Listing } from '../../entities/listing.entity';
import { ListingResponseDto } from '../dto/responses/listing-response.dto';
import { ListingDetailResponseDto } from '../dto/responses/listing-detail-response.dto';
import { ListingListResponseDto } from '../dto/responses/listing-list-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';

export class ListingMapper {
  static toResponseDto(listing: Listing): ListingResponseDto {
    const dto = new ListingResponseDto();
    
    dto.id = listing.id;
    dto.user = UserMapper.toPublicResponseDto(listing.user);
    dto.status = listing.status;
    dto.title = listing.title;
    dto.type = listing.type;
    dto.price = listing.price;
    dto.currency = listing.currency;
    dto.pricePeriod = listing.pricePeriod;
    dto.address = listing.address;
    dto.photosJson = listing.photosJson;
    dto.viewsCount = listing.viewsCount;
    dto.repostsCount = listing.repostsCount;
    dto.favoritesCount = listing.favoritesCount;
    dto.createdAt = listing.createdAt;

    return dto;
  }


  private static parseStringAvailability(stringAvailability: string): string[] {
    if (!stringAvailability || stringAvailability === '{}') return [];

    const result = stringAvailability
      .replace(/^{/, '')
      .replace(/}$/, '')
      .replace(/\\"/g, '')
      .replace(/"/g, '')
      .match(/\[.*?\)/g);

    return result ?? [];
  }


  static toDetailResponseDto(listing: Listing): ListingDetailResponseDto {
    const baseDto = this.toResponseDto(listing);
    const dto = new ListingDetailResponseDto();
    
    Object.assign(dto, baseDto);
    
    dto.description = listing.description;
    dto.size = listing.size;
    dto.amenities = listing.amenities;
    
    if (listing.location?.coordinates) {
      dto.location = {
        longitude: listing.location.coordinates[0],
        latitude: listing.location.coordinates[1]
      };
    } else {
      dto.location = null;
    }

    let availabilityArray;
    if (!listing.availability) {
      availabilityArray = [];
    }
    else if (Array.isArray(listing.availability)) {
      availabilityArray = listing.availability;
    }
    else if (typeof listing.availability === 'string') {
      availabilityArray = this.parseStringAvailability(String(listing.availability));
    }
    else {
      throw new Error(`Failed to parse availability with type '${typeof listing.availability}'`);
    }

    dto.availability = availabilityArray.map(intervalStr => {
      const cleanStr = intervalStr.replace(/[\[)]/g, '');
      const parts = cleanStr.split(',').map(date => date.trim());
      if (parts.length !== 2) {
        throw new Error(`Availability range contains more than 2 dates: ${parts}`);
      }
      return {
        start: new Date(parts[0]).toISOString(),
        end: new Date(parts[1]).toISOString()
      };
    });

    return dto;
  }


  static toListResponseDto(
    listings: Listing[], 
    total: number, 
    limit: number, 
    offset: number
  ): ListingListResponseDto {
    const dto = new ListingListResponseDto();
    
    dto.listings = listings.map(listing => this.toResponseDto(listing));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;

    return dto;
  }
}
