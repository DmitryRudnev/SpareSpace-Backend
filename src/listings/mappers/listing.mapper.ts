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
    dto.firstPhotoUrl = listing.photosJson && listing.photosJson.length > 0 
      ? listing.photosJson[0] 
      : null;
    dto.viewsCount = listing.viewsCount;
    dto.repostsCount = listing.repostsCount;
    dto.favoritesCount = listing.favoritesCount;
    dto.createdAt = new Date(listing.createdAt).toISOString();
    return dto;
  }

  static toDetailResponseDto(listing: Listing): ListingDetailResponseDto {
    const dto = new ListingDetailResponseDto();
    
    dto.id = listing.id;
    dto.user = UserMapper.toPublicResponseDto(listing.user);
    dto.status = listing.status;
    dto.title = listing.title;
    dto.type = listing.type;
    dto.size = listing.size;
    dto.description = listing.description;
    dto.price = listing.price;
    dto.currency = listing.currency;
    dto.pricePeriod = listing.pricePeriod;
    dto.address = listing.address;
    dto.photoUrls = listing.photosJson;
    dto.amenities = listing.amenities;
    dto.viewsCount = listing.viewsCount;
    dto.repostsCount = listing.repostsCount;
    dto.favoritesCount = listing.favoritesCount;
    dto.createdAt = new Date(listing.createdAt).toISOString();
    dto.updatedAt = new Date(listing.updatedAt).toISOString();

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
    dto.availability = availabilityArray.map(periodStr => {
      return this.parsePeriodString(periodStr);
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

    dto.listings = listings.map(listing => this.toDetailResponseDto(listing));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;
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


  private static parsePeriodString(periodString: string): { start: string; end: string } {
    if (!periodString || periodString === '[]') {
      throw new Error('Invalid period string');
    }
    const cleanStr = periodString.replace(/[\[\)]/g, '').trim();
    const parts = cleanStr.split(',').map(date => date.trim());
    if (parts.length !== 2) {
      throw new Error(`Invalid availability period format: ${periodString}`);
    }
    const start = new Date(parts[0]).toISOString();
    const end = new Date(parts[1]).toISOString();
    return { start, end };
  }
}
