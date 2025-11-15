import { Booking } from '../../entities/booking.entity';
import { BookingResponseDto } from '../dto/responses/booking-response.dto';
import { BookingDetailResponseDto } from '../dto/responses/booking-detail-response.dto';
import { BookingListResponseDto } from '../dto/responses/booking-list-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';
import { ListingMapper } from '../../listings/mappers/listing.mapper';

export class BookingMapper {
  static toResponseDto(booking: Booking): BookingResponseDto {
    const dto = new BookingResponseDto();
    
    dto.id = booking.id;
    dto.listingTitle = booking.listing.title;
    dto.firstListingPhoto = booking.listing.photosJson && booking.listing.photosJson.length > 0 
      ? booking.listing.photosJson[0] 
      : null;
    dto.renter = UserMapper.toPublicResponseDto(booking.renter);
    dto.landlord = UserMapper.toPublicResponseDto(booking.listing.user);
    dto.totalPrice = booking.totalPrice;
    dto.currency = booking.currency;
    dto.status = booking.status;
    dto.createdAt = new Date(booking.createdAt).toISOString();
    return dto;
  }

  static toDetailResponseDto(booking: Booking): BookingDetailResponseDto {
    const dto = new BookingDetailResponseDto();

    dto.id = booking.id;
    dto.listing = ListingMapper.toResponseDto(booking.listing);
    dto.renter = UserMapper.toPublicResponseDto(booking.renter);
    dto.landlord = UserMapper.toPublicResponseDto(booking.listing.user);
    dto.totalPrice = booking.totalPrice;
    dto.currency = booking.currency;
    dto.status = booking.status;
    dto.period = this.parsePeriodString(booking.period);
    dto.createdAt = new Date(booking.createdAt).toISOString();
    dto.updatedAt = new Date(booking.updatedAt).toISOString();
    return dto;
  }

  static toListResponseDto(
    bookings: Booking[], 
    total: number, 
    limit: number, 
    offset: number
  ): BookingListResponseDto {
    const dto = new BookingListResponseDto();
    
    dto.bookings = bookings.map(booking => this.toResponseDto(booking));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;
    return dto;
  }

  private static parsePeriodString(periodString: string): { start: string; end: string } {
    if (!periodString || periodString === '[]') {
      throw new Error('Invalid period string');
    }
    const cleanStr = periodString.replace(/[\[\)]/g, '').trim();
    const parts = cleanStr.split(',').map(date => date.trim());
    if (parts.length !== 2) {
      throw new Error(`Invalid booking period format: ${periodString}`);
    }
    const start = new Date(parts[0]).toISOString();
    const end = new Date(parts[1]).toISOString();
    return { start, end };
  }
}
