import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Booking } from '../entities/booking.entity';
import { User } from '../entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { SearchReviewsDto } from './dto/search-reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewRepository: Repository<Review>,
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  private async validateBookingForReview(bookingId: number, userId: number) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['listing', 'renter', 'listing.user'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'COMPLETED') throw new BadRequestException('Only completed bookings can be reviewed');

    const isRenter = booking.renter.id === userId;
    const isLandlord = booking.listing.user.id === userId;
    if (!isRenter && !isLandlord) throw new UnauthorizedException('Not authorized to review this booking');

    return booking;
  }

  private async validateNoExistingReview(booking: Booking, userId: number) {
    const toUserId = booking.renter.id === userId ? booking.listing.user.id : booking.renter.id;
    
    const existingReview = await this.reviewRepository.findOne({
      where: {
        listing: { id: booking.listing.id },
        from_user: { id: userId },
        to_user: { id: toUserId },
      },
    });
    if (existingReview) throw new ConflictException('Review already exists for this booking');
  }

  private async createReviewEntity(dto: CreateReviewDto, booking: Booking, userId: number) {
    const toUserId = booking.renter.id === userId ? booking.listing.user.id : booking.renter.id;
    
    return this.reviewRepository.create({
      listing: booking.listing,
      from_user: { id: userId },
      to_user: { id: toUserId },
      rating: dto.rating,
      text: dto.text,
    });
  }

  private buildSearchQuery(searchDto: SearchReviewsDto) {
    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.from_user', 'fromUser')
      .leftJoinAndSelect('review.to_user', 'toUser')
      .leftJoinAndSelect('review.listing', 'listing');

    if (searchDto.to_user_id) query.andWhere('review.to_user.id = :toUserId', { toUserId: searchDto.to_user_id });
    if (searchDto.listing_id) query.andWhere('review.listing.id = :listingId', { listingId: searchDto.listing_id });

    if (searchDto.limit) query.limit(searchDto.limit);
    if (searchDto.offset) query.offset(searchDto.offset);

    return query;
  }

  async create(dto: CreateReviewDto, userId: number) {
    const booking = await this.validateBookingForReview(dto.booking_id, userId);
    await this.validateNoExistingReview(booking, userId);
    
    const review = await this.createReviewEntity(dto, booking, userId);
    return this.reviewRepository.save(review);
  }

  async findAll(searchDto: SearchReviewsDto) {
    const query = this.buildSearchQuery(searchDto);
    const [reviews, total] = await query.getManyAndCount();
    return { reviews, total, limit: searchDto.limit, offset: searchDto.offset };
  }

  async findOne(id: number) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['from_user', 'to_user', 'listing'],
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }
}
