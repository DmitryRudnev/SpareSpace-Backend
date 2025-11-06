import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { Listing } from '../entities/listing.entity';
import { User } from '../entities/user.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { UsersService } from '../users/users.service';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { CurrencyType } from '../common/enums/currency-type.enum';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing) private listingRepository: Repository<Listing>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(ViewHistory) private viewHistoryRepository: Repository<ViewHistory>,
    private userService: UsersService,
  ) {}

  private async validateUser(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private async validateLandlordRole(user: User) {
    const hasLandlord = await this.userService.hasRole(user.id, UserRoleType.LANDLORD);
    if (!hasLandlord) throw new UnauthorizedException('Only landlords can create listings');
  }

  private createLocationPoint(dto: CreateListingDto | UpdateListingDto) {
    if (dto.latitude && dto.longitude) {
      return { type: "Point", coordinates: [dto.longitude, dto.latitude] };
    }
    return null;
  }

  private parseAvailability(availability: any[] | undefined) {
    if (!availability || !Array.isArray(availability)) return [];
    return availability.map(p => `[${p.start.toISOString()},${p.end.toISOString()})`);
  }

  private async validateListingOwnership(id: number, userId: number) {
    const listing = await this.listingRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user']
    });
    if (!listing) throw new UnauthorizedException('Not authorized to modify this listing');
    return listing;
  }

  private buildSearchQuery(searchDto: SearchListingsDto) {
    let query = this.listingRepository.createQueryBuilder('listing')
      .where('listing.status = :status', { status: 'ACTIVE' });

    if (searchDto.type) query.andWhere('listing.type = :type', { type: searchDto.type });
    if (searchDto.currency) query.andWhere('listing.currency = :currency', { currency: searchDto.currency });
    if (searchDto.minPrice) query.andWhere('listing.price >= :minPrice', { minPrice: searchDto.minPrice });
    if (searchDto.maxPrice) query.andWhere('listing.price <= :maxPrice', { maxPrice: searchDto.maxPrice });
    if (searchDto.pricePeriod) query.andWhere('listing.price_period = :pricePeriod', { pricePeriod: searchDto.pricePeriod });
    if (searchDto.latitude && searchDto.longitude && searchDto.radius) {
      query.andWhere(
        "ST_DWithin(listing.location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :radius)",
        { lon: searchDto.longitude, lat: searchDto.latitude, radius: searchDto.radius / 1000 }  // конвертируем в км
      );
    }
    if (searchDto.amenities) {
      Object.keys(searchDto.amenities).forEach(key => {
        query.andWhere(`listing.amenities ->> '${key}' = :value`, { value: searchDto.amenities[key] });
      });
    }

    query.orderBy('listing.created_at', 'DESC');

    if (searchDto.limit) query.limit(searchDto.limit);
    if (searchDto.offset) query.offset(searchDto.offset);

    return query;
  }

  async create(dto: CreateListingDto, userId: number) {
    const user = await this.validateUser(userId);

    const dtoDescription = dto.description ? dto.description : null;
    const dtoSize = dto.size ? dto.size : null;
    const dtoPhotos = dto.photosJson ? dto.photosJson : null;

    const listingData: any = {
      user: user,
      type: dto.type,
      title: dto.title,
      description: dtoDescription,
      price: dto.price,
      pricePeriod: dto.pricePeriod,
      currency: dto.currency,
      address: dto.address,
      size: dtoSize,
      photosJson: dtoPhotos,
      availability: this.parseAvailability(dto.availability),
    }
    
    const dtoLocation = this.createLocationPoint(dto);
    if (dtoLocation) {
      listingData.location = dtoLocation;
    }

    if (dto.amenities) {
      listingData.amenities = typeof dto.amenities === 'string' ? dto.amenities : JSON.stringify(dto.amenities);
    }

    const listing = this.listingRepository.create(listingData);
    await this.userService.addRole(userId, UserRoleType.LANDLORD);
    return await this.listingRepository.save(listing);
  }

  async findAll(searchDto: SearchListingsDto) {
    const [listings, total] = await this.buildSearchQuery(searchDto).getManyAndCount();
    return { listings, total, limit: searchDto.limit, offset: searchDto.offset};
  }

  async findOne(id: number, userId?: number) {
    const listing = await this.listingRepository.findOne({
      where: { id, status: ListingStatus.ACTIVE },
      relations: ['user'],
    });
    if (!listing) throw new NotFoundException('Listing not found');

    if (userId) {
      await this.viewHistoryRepository.insert({
        user: { id: userId },
        listing: listing,
      });
    }
    return listing;
  }

  async findByUser(userId: number, currentUserId?: number, searchDto?: SearchListingsDto) {
    await this.validateUser(userId);

    const isOwner = currentUserId === userId;
    const allowedStatuses = isOwner ? [ListingStatus.ACTIVE, ListingStatus.DRAFT] : [ListingStatus.ACTIVE];

    const query = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.user', 'user')
      .where('listing.user_id = :userId', { userId })
      .andWhere('listing.status IN (:...statuses)', { statuses: allowedStatuses });

    if (searchDto?.type) query.andWhere('listing.type = :type', { type: searchDto.type });
    if (searchDto?.currency) query.andWhere('listing.currency = :currency', { currency: searchDto.currency });
    if (searchDto?.minPrice) query.andWhere('listing.price >= :minPrice', { minPrice: searchDto.minPrice });
    if (searchDto?.maxPrice) query.andWhere('listing.price <= :maxPrice', { maxPrice: searchDto.maxPrice });
    if (searchDto?.pricePeriod) query.andWhere('listing.price_period = :pricePeriod', { pricePeriod: searchDto.pricePeriod });
    if (searchDto?.latitude && searchDto?.longitude && searchDto?.radius) {
      query.andWhere(
        "ST_DWithin(listing.location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :radius)",
        { lon: searchDto.longitude, lat: searchDto.latitude, radius: searchDto.radius / 1000 }  // конвертируем в км
      );
    }
    if (searchDto?.amenities) {
      Object.keys(searchDto.amenities).forEach(key => {
        query.andWhere(`listing.amenities ->> '${key}' = :value`, { value: searchDto.amenities[key] });
      });
    }

    query.orderBy('listing.created_at', 'DESC');

    if (searchDto?.limit) query.limit(searchDto.limit);
    if (searchDto?.offset) query.offset(searchDto.offset);

    const [listings, total] = await query.getManyAndCount();
    return { listings, total, limit: searchDto?.limit, offset: searchDto?.offset };
  }

  async update(id: number, dto: UpdateListingDto, userId: number) {
    const listing = await this.validateListingOwnership(id, userId);

    const updatedData: any = {
      ...listing,
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.pricePeriod !== undefined && { pricePeriod: dto.pricePeriod }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.size !== undefined && { size: dto.size }),
      ...(dto.photosJson !== undefined && { photosJson: dto.photosJson }),
      ...(dto.amenities !== undefined && { amenities: JSON.stringify(dto.amenities) }),
      ...(dto.availability !== undefined && { availability: this.parseAvailability(dto.availability) }),
    };

    const dtoLocation = this.createLocationPoint(dto);
    if (dtoLocation) {
      updatedData.location = dtoLocation;
    }

    const updatedListing = this.listingRepository.create(updatedData);
    return await this.listingRepository.save(updatedListing);
  }

  async remove(id: number, userId: number) {
    const listing = await this.validateListingOwnership(id, userId);
    listing.status = ListingStatus.INACTIVE;
    return this.listingRepository.save(listing);
  }
}
