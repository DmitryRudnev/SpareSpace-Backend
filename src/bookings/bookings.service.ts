import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Listing } from '../entities/listings.entity';
import { User } from '../entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { SearchBookingsDto } from './dto/search-bookings.dto';
import { UserService } from '../users/users.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    @InjectRepository(Listing) private listingRepository: Repository<Listing>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private userService: UserService,
  ) {}

  private async validateUser(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private async validateRenterRole(user: User) {
    const hasRenter = await this.userService.hasRole(user.id, 'RENTER');
    if (!hasRenter) throw new UnauthorizedException('Only renters can create bookings');
  }

  private async validateLandlordOwnership(booking: Booking, userId: number) {
    const hasLandlord = await this.userService.hasRole(userId, 'LANDLORD');
    if (!hasLandlord) throw new UnauthorizedException('Not authorized to modify this booking');
  }

  private calculateDuration(start: Date, end: Date): number {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  }

  private calculatePriceTotal(listingPrice: number, duration: number): number {
    return listingPrice * duration;
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
    if (!listing || listing.status !== 'ACTIVE') throw new BadRequestException('Invalid or inactive listing');

    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);
    if (startDate >= endDate) throw new BadRequestException('Invalid period');

    const duration = this.calculateDuration(startDate, endDate);
    const priceTotal = this.calculatePriceTotal(listing.price, duration);

    const booking = this.bookingRepository.create({
      listing_id: listing,
      renter_id: user,
      period: this.parseTsRange(dto.start_date, dto.end_date),
      price_total: priceTotal,
      currency: listing.currency,
      status: 'PENDING',
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
      .leftJoinAndSelect('booking.listing_id', 'listing')
      .leftJoinAndSelect('booking.renter_id', 'renter')
      .where('(booking.renter_id.id = :userId OR listing.user_id.id = :userId)', { userId });

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
      relations: ['listing_id', 'renter_id', 'listing_id.user_id'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async update(id: number, dto: UpdateBookingDto, userId: number) {
    const booking = await this.findOne(id);
    if (booking.renter_id.id !== userId) throw new UnauthorizedException('Only renter can update this booking');

    const startDate = dto.start_date ? new Date(dto.start_date) : undefined;
    const endDate = dto.end_date ? new Date(dto.end_date) : undefined;
    if (startDate && endDate && startDate >= endDate) throw new BadRequestException('Invalid period');

    if (startDate && endDate) {
      booking.period = this.parseTsRange(dto.start_date, dto.end_date);
      const duration = this.calculateDuration(startDate, endDate);
      booking.price_total = this.calculatePriceTotal(booking.listing_id.price, duration);
    }

    Object.assign(booking, dto);
    return this.bookingRepository.save(booking);
  }

  async changeStatus(id: number, newStatus: string, userId: number) {
    const booking = await this.findOne(id);
    await this.validateLandlordOwnership(booking, userId);

    if (booking.status === 'COMPLETED') throw new BadRequestException('Cannot change completed booking');

    booking.status = newStatus;
    return this.bookingRepository.save(booking);
  }

  async remove(id: number, userId: number) {
    const booking = await this.findOne(id);
    if (booking.renter_id.id !== userId && booking.listing_id.user_id.id !== userId) {
      throw new UnauthorizedException('Not authorized to cancel this booking');
    }

    booking.status = 'CANCELLED';
    return this.bookingRepository.save(booking);
  }
}