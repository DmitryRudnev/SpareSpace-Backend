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

  private async validateUser(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async create(dto: CreateReviewDto, userId: number) {
    const user = await this.validateUser(userId);
    const booking = await this.bookingRepository.findOne({
      where: { id: dto.booking_id },
      relations: ['listing_id', 'renter_id', 'listing_id.user_id'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'COMPLETED') throw new BadRequestException('Only completed bookings can be reviewed');

    const isRenter = booking.renter_id.id === userId;
    const isLandlord = booking.listing_id.user_id.id === userId;
    if (!isRenter && !isLandlord) throw new UnauthorizedException('Not authorized to review this booking');

    const existingReview = await this.reviewRepository.findOne({
      where: {
        listing_id: { id: booking.listing_id.id },
        from_user_id: { id: userId },
        to_user_id: { id: isRenter ? booking.listing_id.user_id.id : booking.renter_id.id },
      },
    });
    if (existingReview) throw new ConflictException('Review already exists for this booking');

    const review = this.reviewRepository.create({
      listing_id: booking.listing_id,
      from_user_id: user,
      to_user_id: { id: isRenter ? booking.listing_id.user_id.id : booking.renter_id.id },
      rating: dto.rating,
      text: dto.text,
    });

    const savedReview = await this.reviewRepository.save(review);
    // Триггер обновит users.rating для to_user_id
    const toUser = await this.userRepository.findOneBy({ id: review.to_user_id.id });
    savedReview.to_user = toUser; // Для возврата с rating
    return savedReview;
  }

  async findAll(searchDto: SearchReviewsDto) {
    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.from_user_id', 'fromUser')
      .leftJoinAndSelect('review.to_user_id', 'toUser')
      .leftJoinAndSelect('review.listing_id', 'listing');

    if (searchDto.to_user_id) query.andWhere('review.to_user_id.id = :toUserId', { toUserId: searchDto.to_user_id });
    if (searchDto.listing_id) query.andWhere('review.listing_id.id = :listingId', { listingId: searchDto.listing_id });

    const [reviews, total] = await query
      .limit(searchDto.limit)
      .offset(searchDto.offset)
      .getManyAndCount();

    return { reviews, total, limit: searchDto.limit, offset: searchDto.offset };
  }

  async findOne(id: number) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['from_user_id', 'to_user_id', 'listing_id'],
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async getAvgRating(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    return user.rating || 0;
  }
}