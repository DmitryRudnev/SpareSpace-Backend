import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { Listing } from '../entities/listings.entity';
import { User } from '../entities/user.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { UserService } from '../users/users.service';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing) private listingRepository: Repository<Listing>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(ViewHistory) private viewHistoryRepository: Repository<ViewHistory>,
    private userService: UserService,
  ) {}

  private async validateUser(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private async validateLandlordRole(user: User) {
    const hasLandlord = await this.userService.hasRole(user.id, 'LANDLORD');
    if (!hasLandlord) throw new UnauthorizedException('Only landlords can create listings');
  }

  private createLocationPoint(dto: CreateListingDto | UpdateListingDto) {
    if (dto.latitude && dto.longitude) {
      return `ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geometry`;
    }
    return null;
  }

  private parseAvailability(availability: any[]) {
    if (!availability || !Array.isArray(availability)) return '{}';
    return availability.map(p => `tsrange('${p.start}', '${p.end}', '[]')`);
  }

  private async validateListingOwnership(id: number, userId: number) {
    const listing = await this.listingRepository.findOne({
      where: { id, user_id: { id: userId } },
    });
    if (!listing) throw new UnauthorizedException('Not authorized to modify this listing');
    return listing;
  }

  async create(dto: CreateListingDto, userId: number) {
    const user = await this.validateUser(userId);
    await this.validateLandlordRole(user);
    const listing = this.listingRepository.create({
      type: dto.type,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      currency: dto.currency || 'RUB',
      location: this.createLocationPoint(dto),
      address: dto.address,
      size: dto.size,
      photos_json: dto.photos_json,
      amenities: dto.amenities ? JSON.stringify(dto.amenities) : null,
      availability: this.parseAvailability(dto.availability),
      user_id: user,
    });
    return this.listingRepository.save(listing);
  }

  private buildSearchQuery(searchDto: SearchListingsDto) {
    let query = this.listingRepository.createQueryBuilder('listing').where('listing.status = :status', { status: 'ACTIVE' });

    if (searchDto.type) query.andWhere('listing.type = :type', { type: searchDto.type });
    if (searchDto.minPrice) query.andWhere('listing.price >= :minPrice', { minPrice: searchDto.minPrice });
    if (searchDto.maxPrice) query.andWhere('listing.price <= :maxPrice', { maxPrice: searchDto.maxPrice });
    if (searchDto.latitude && searchDto.longitude && searchDto.radius) {
      query.andWhere(
        "ST_DWithin(listing.location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :radius)",
        { lon: searchDto.longitude, lat: searchDto.latitude, radius: searchDto.radius / 111000 }, // approx meters to degrees
      );
    }
    if (searchDto.amenities) {
      const amenitiesKeys = Object.keys(searchDto.amenities);
      amenitiesKeys.forEach(key => {
        query.andWhere(`listing.amenities ? '${key}'`, {});
      });
    }

    query.orderBy('listing.price', 'ASC');

    if (searchDto.limit) query.limit(searchDto.limit);
    if (searchDto.offset) query.offset(searchDto.offset);

    return query;
  }

  async findAll(searchDto: SearchListingsDto) {
    const [listings, total] = await this.buildSearchQuery(searchDto).getManyAndCount();
    return { listings, total, limit: searchDto.limit || 10, offset: searchDto.offset || 0 };
  }

  async findOne(id: number, userId?: number) {
    const listing = await this.listingRepository.findOne({
      where: { id, status: 'ACTIVE' },
      relations: ['user_id'],
    });
    if (!listing) throw new NotFoundException('Listing not found');

    if (userId) {
      await this.viewHistoryRepository.insert({
        user_id: { id: userId },
        listing_id: listing,
      });
    } else {
      await this.viewHistoryRepository.insert({
        listing_id: listing,
      });
    }

    return listing;
  }

  async update(id: number, dto: UpdateListingDto, userId: number) {
    const listing = await this.validateListingOwnership(id, userId);
    if (dto.type) listing.type = dto.type;
    if (dto.title !== undefined) listing.title = dto.title;
    if (dto.description !== undefined) listing.description = dto.description;
    if (dto.price !== undefined) listing.price = dto.price;
    if (dto.currency !== undefined) listing.currency = dto.currency;
    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      listing.location = this.createLocationPoint(dto);
    }
    if (dto.address !== undefined) listing.address = dto.address;
    if (dto.size !== undefined) listing.size = dto.size;
    if (dto.photos_json !== undefined) listing.photos_json = dto.photos_json;
    if (dto.amenities !== undefined) listing.amenities = JSON.stringify(dto.amenities);
    if (dto.availability !== undefined) listing.availability = this.parseAvailability(dto.availability);
    return this.listingRepository.save(listing);
  }

  async remove(id: number, userId: number) {
    const listing = await this.validateListingOwnership(id, userId);
    listing.status = 'INACTIVE';
    return this.listingRepository.save(listing);
  }
}