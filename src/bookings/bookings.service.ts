import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { BookingStatus } from '../common/enums/booking-status.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { Booking } from '../entities/booking.entity';
import { Listing } from '../entities/listing.entity';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/services/users.service';

import { CreateBookingDto } from './dto/requests/create-booking.dto';
import { SearchBookingsDto } from './dto/requests/search-bookings.dto';
import { UpdateBookingPeriodDto } from './dto/requests/update-booking-period.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Listing) private readonly listingRepository: Repository<Listing>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly userService: UsersService,
  ) {}

  /**
   * Retrieves bookings with search filters.
   * @param searchDto - The search DTO.
   * @param userId - The user ID for filtering.
   * @returns Paginated bookings with metadata.
   */
  async findAll(
    searchDto: SearchBookingsDto,
    userId: number,
  ): Promise<{ bookings: Booking[]; total: number; limit: number; offset: number; }> {
    const [bookings, total] = await this.buildSearchQuery(searchDto, userId).getManyAndCount();
    return { bookings, total, limit: searchDto.limit, offset: searchDto.offset };
  }


  async countByRole(userId: number, roleType: UserRoleType): Promise<number> {
    if (roleType == UserRoleType.RENTER) {
      return await this.bookingRepository.countBy({
        renter: { id: userId },
      });
    }

    return await this.bookingRepository.countBy({
      listing: { user: { id: userId } },
    });
  }

  
  /**
   * Retrieves a single booking by ID.
   * @param bookingId - The booking ID.
   * @returns The booking entity.
   * @throws NotFoundException if booking not found.
   * @throws UnauthorizedException if user is not member of booking.
   */
  async findById(bookingId: number, userId: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['listing', 'renter', 'listing.user']
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (Number(booking.renter.id) !== userId && Number(booking.listing.user.id) !== userId) {
      throw new UnauthorizedException('Not authorized to cancel this booking');
    }
    return booking;
  }

  /**
   * Creates a new booking.
   * @param dto - The creation DTO.
   * @param userId - The creating user ID.
   * @returns The saved booking entity.
   */
  async create(dto: CreateBookingDto, userId: number): Promise<Booking> {
    const startDate = new Date(dto.period.start);
    const endDate = new Date(dto.period.end);
    this.validateBookingDates(startDate, endDate);
    const renter = await this.validateRenter(userId);
    const listing = await this.validateListing(dto.listingId);
    await this.validateListingAvailability(listing.id, startDate, endDate);

    const duration = this.calculateDuration(startDate, endDate, listing.pricePeriod);
    const totalPrice = listing.price * duration;
    const period = `[${startDate.toISOString()},${endDate.toISOString()})`;
    const booking = this.bookingRepository.create({
      listing,
      renter,
      period,
      totalPrice,
      currency: listing.currency,
      status: BookingStatus.PENDING
    });
    return this.bookingRepository.save(booking);
  }

  /**
   * Updates an existing booking.
   * @param bookingId - The booking ID.
   * @param dto - The update DTO.
   * @param userId - The updating user ID.
   * @returns The saved booking entity.
   */
  async update(bookingId: number, dto: UpdateBookingPeriodDto, userId: number): Promise<Booking> {
    const booking = await this.findById(bookingId, userId);
    if (Number(booking.renter.id) !== userId) {
      throw new UnauthorizedException('Only renter can update this booking');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be updated');
    }
    const startDate = new Date(dto.period.start);
    const endDate = new Date(dto.period.end);
    this.validateBookingDates(startDate, endDate);
    await this.validateListingAvailability(booking.listing.id, startDate, endDate, bookingId);

    const periodString = `[${startDate.toISOString()},${endDate.toISOString()})`;
    const duration = this.calculateDuration(startDate, endDate, booking.listing.pricePeriod);
    booking.period = periodString;
    booking.totalPrice = booking.listing.price * duration;
    return this.bookingRepository.save(booking);
  }

  /**
   * Changes booking status.
   * @param bookingId - The booking ID.
   * @param newStatus - The new status.
   * @param userId - The user ID changing status.
   * @returns The saved booking entity.
   */
  async updateStatus(bookingId: number, newStatus: BookingStatus, userId: number): Promise<Booking> {
    const booking = await this.findById(bookingId, userId);
    await this.validateLandlordOwnership(booking, userId);
    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot change completed or cancelled booking');
    }
    booking.status = newStatus;
    return this.bookingRepository.save(booking);
  }

  /**
   * Cancels a booking.
   * @param bookingId - The booking ID.
   * @param userId - The cancelling user ID.
   * @returns The saved booking entity.
   */
  async remove(bookingId: number, userId: number): Promise<Booking> {
    const booking = await this.findById(bookingId, userId);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be cancelled');
    }
    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }

  /**
   * Validates user existence and renter role.
   * @param userId - The user ID to validate.
   * @returns The found user entity.
   * @throws UnauthorizedException if user not found or not a renter.
   */
  private async validateRenter(userId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const hasRenter = await this.userService.hasRole(user.id, UserRoleType.RENTER);
    if (!hasRenter) {
      throw new UnauthorizedException('Only renters can create bookings');
    }
    return user;
  }

  /**
   * Validates listing existence and active status.
   * @param listingId - The listing ID to validate.
   * @returns The found listing entity.
   * @throws BadRequestException if listing not found or not active.
   */
  private async validateListing(listingId: number): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['user']
    });
    if (!listing) {
      throw new BadRequestException('Listing not found');
    }
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Cannot rent inactive listing');
    }
    return listing;
  }

  /**
   * Validates landlord ownership of booking's listing.
   * @param booking - The booking entity.
   * @param userId - The user ID to validate ownership.
   * @throws UnauthorizedException if not authorized.
   */
  private async validateLandlordOwnership(booking: Booking, userId: number): Promise<void> {
    const hasLandlord = await this.userService.hasRole(userId, UserRoleType.LANDLORD);
    if (!hasLandlord || Number(booking.listing.user.id) !== userId) {
      throw new UnauthorizedException('Not authorized to modify this booking');
    }
  }

  /**
   * Validates booking dates.
   * @param startDate - Start date.
   * @param endDate - End date.
   * @throws BadRequestException for invalid dates.
   */
  private validateBookingDates(startDate: Date, endDate: Date): void {
    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }
    if (endDate <= startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }
  }

  /**
   * Validates listing availability for given period.
   * @param listingId - The listing ID.
   * @param start - Start date.
   * @param end - End date.
   * @param excludeBookingId - Optional booking ID to exclude from check.
   * @throws ConflictException if booking overlapps with other one.
   */
  private async validateListingAvailability(
    listingId: number,
    start: Date,
    end: Date,
    excludeBookingId?: number
  ): Promise<void> {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.listing_id = :listingId', { listingId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
      })
      .andWhere('booking.period && tstzrange(:start, :end)', { start, end });
    if (excludeBookingId) {
      query.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }
    const overlapping = await query.getOne();
    if (!!overlapping) {
      throw new ConflictException('Listing not available for selected period');
    }
  }

  /**
   * Builds search query for bookings with filters.
   * @param searchDto - The search DTO.
   * @param userId - The user ID for filtering.
   * @returns Configured query builder.
   */
  private buildSearchQuery(
    searchDto: SearchBookingsDto,
    userId: number
  ): SelectQueryBuilder<Booking> {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.listing', 'listing')
      .leftJoinAndSelect('booking.renter', 'renter')
      .leftJoinAndSelect('listing.user', 'landlord');
    
    switch (searchDto.userRole) {
      case UserRoleType.RENTER:
        query.where('booking.renter.id = :userId', { userId });
        break;
      case UserRoleType.LANDLORD:
        query.where('listing.user.id = :userId', { userId });
        break;
      default:
        query.where('(booking.renter.id = :userId OR listing.user.id = :userId)', { userId });
    }
    if (searchDto.status) {
      query.andWhere('booking.status = :status', { status: searchDto.status });
    }
    return query
      .orderBy('booking.created_at', 'DESC')
      .limit(searchDto.limit)
      .offset(searchDto.offset);
  }

  /**
   * Calculates booking duration based on price period.
   * @param start - Start date.
   * @param end - End date.
   * @param pricePeriod - The price period unit.
   * @returns Calculated duration.
   * @throws BadRequestException for invalid price period.
   */
  private calculateDuration(start: Date, end: Date, pricePeriod: string): number {
    const durationMs = end.getTime() - start.getTime();
    switch (pricePeriod) {
      case 'HOUR':  return Math.ceil(durationMs / (1000 * 60 * 60));
      case 'DAY':   return Math.ceil(durationMs / (1000 * 60 * 60 * 24));
      case 'WEEK':  return Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7));
      case 'MONTH': return Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 30));
      default: throw new BadRequestException('Invalid price period');
    }
  }
}
