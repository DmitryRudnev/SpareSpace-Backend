import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Listing } from '../entities/listing.entity';
import { User } from '../entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { SearchBookingsDto } from './dto/search-bookings.dto';
import { UsersService } from '../users/users.service';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { UserRoleType } from '../common/enums/user-role-type.enum';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    @InjectRepository(Listing) private listingRepository: Repository<Listing>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private userService: UsersService,
  ) {}

  private async validateUser(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private async validateRenterRole(user: User) {
    const hasRenter = await this.userService.hasRole(user.id, UserRoleType.RENTER);
    if (!hasRenter) throw new UnauthorizedException('Only renters can create bookings');
  }

  private async validateLandlordOwnership(booking: Booking, userId: number) {
    const hasLandlord = await this.userService.hasRole(userId, UserRoleType.LANDLORD);
    if (!hasLandlord) throw new UnauthorizedException('Not authorized to modify this booking');
  }

  private calculateDuration(start: Date, end: Date, pricePeriod: string): number {
    const durationMs = end.getTime() - start.getTime();
    
    switch (pricePeriod) {
      case 'HOUR':
        return durationMs / (1000 * 60 * 60);
      case 'DAY':
        return durationMs / (1000 * 60 * 60 * 24);
      case 'WEEK':
        return durationMs / (1000 * 60 * 60 * 24 * 7);
      case 'MONTH':
        return durationMs / (1000 * 60 * 60 * 24 * 30); // приблизительно
      default:
        throw new BadRequestException('Invalid price period');
    }
  }

  private parseTsRange(start: string, end: string): string {
    const startDate = new Date(start).toISOString();
    const endDate = new Date(end).toISOString();
    return `tsrange('${startDate}', '${endDate}', '[]')`;
  }

  async create(dto: CreateBookingDto, userId: number) {
    const user = await this.validateUser(userId);
    await this.validateRenterRole(user);

    const listing = await this.listingRepository.findOneBy({ id: dto.listing_id });
    if (!listing || listing.status !== ListingStatus.ACTIVE) throw new BadRequestException('Invalid or inactive listing');

    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);
    if (startDate >= endDate) throw new BadRequestException('Invalid period');

    const duration = this.calculateDuration(startDate, endDate, listing.price_period);
    const priceTotal = listing.price * duration;

    const booking = this.bookingRepository.create({
      listing: listing,
      renter: user,
      period: this.parseTsRange(dto.start_date, dto.end_date),
      price_total: priceTotal,
      currency: listing.currency,
      status: BookingStatus.PENDING,
    });

    try {
      return await this.bookingRepository.save(booking);
    } catch (error) {
      if (error.message.includes('overlaps')) throw new BadRequestException('Booking period overlaps with existing booking');
      throw error;
    }
  }

  async findAll(searchDto: SearchBookingsDto, userId: number) {
    const query = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.listing', 'listing')
      .leftJoinAndSelect('booking.renter', 'renter')
      .where('(booking.renter.id = :userId OR listing.user.id = :userId)', { userId });

    if (searchDto.status) query.andWhere('booking.status = :status', { status: searchDto.status });

    const [bookings, total] = await query
      .limit(searchDto.limit)
      .offset(searchDto.offset)
      .getManyAndCount();

    return { bookings, total, limit: searchDto.limit, offset: searchDto.offset };
  }

  async findOne(id: number) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['listing', 'renter', 'listing.user'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async update(id: number, dto: UpdateBookingDto, userId: number) {
    const booking = await this.findOne(id);
    if (booking.renter.id !== userId) throw new UnauthorizedException('Only renter can update this booking');


    if (dto.start_date && dto.end_date) {
      const startDate = new Date(dto.start_date);
      const endDate = new Date(dto.end_date);
      if (startDate && endDate && startDate >= endDate) throw new BadRequestException('Invalid period');
      
      booking.period = this.parseTsRange(dto.start_date, dto.end_date);
      const duration = this.calculateDuration(startDate, endDate, booking.listing.price_period);
      booking.price_total = booking.listing.price * duration;
    }

    Object.assign(booking, dto);
    return this.bookingRepository.save(booking);
  }

  async changeStatus(id: number, newStatus: BookingStatus, userId: number) {
    const booking = await this.findOne(id);
    await this.validateLandlordOwnership(booking, userId);

    if (booking.status === BookingStatus.COMPLETED) throw new BadRequestException('Cannot change completed booking');

    booking.status = newStatus;
    return this.bookingRepository.save(booking);
  }

  async remove(id: number, userId: number) {
    const booking = await this.findOne(id);
    if (booking.renter.id !== userId && booking.listing.user.id !== userId) {
      throw new UnauthorizedException('Not authorized to cancel this booking');
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }
}