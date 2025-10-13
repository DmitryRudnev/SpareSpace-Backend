import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../entities/listings.entity';
import { User } from '../entities/user.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing) private listingRepository: Repository<Listing>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  private async validateUser(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private createLocationPoint(dto: CreateListingDto | UpdateListingDto) {
    return dto.latitude && dto.longitude ? `POINT(${dto.longitude} ${dto.latitude})` : null;
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
    const listing = this.listingRepository.create({
      ...dto,
      user_id: user,
      location: this.createLocationPoint(dto),
    });
    return this.listingRepository.save(listing);
  }

  private buildSearchQuery(searchDto: SearchListingsDto) {
    const query = this.listingRepository.createQueryBuilder('listing').where('listing.status = :status', { status: 'ACTIVE' });

    if (searchDto.type) query.andWhere('listing.type = :type', { type: searchDto.type });
    if (searchDto.minPrice) query.andWhere('listing.price >= :minPrice', { minPrice: searchDto.minPrice });
    if (searchDto.maxPrice) query.andWhere('listing.price <= :maxPrice', { maxPrice: searchDto.maxPrice });
    if (searchDto.latitude && searchDto.longitude && searchDto.radius) {
      query.andWhere(
        'ST_DWithin(listing.location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :radius)',
        { lon: searchDto.longitude, lat: searchDto.latitude, radius: searchDto.radius },
      );
    }
    if (searchDto.amenities) query.andWhere('listing.amenities @> :amenities', { amenities: searchDto.amenities });

    return query;
  }

  async findAll(searchDto: SearchListingsDto) {
    return this.buildSearchQuery(searchDto).getMany();
  }

  async findOne(id: number) {
    const listing = await this.listingRepository.findOne({
      where: { id, status: 'ACTIVE' },
      relations: ['user_id'],
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async update(id: number, dto: UpdateListingDto, userId: number) {
    const listing = await this.validateListingOwnership(id, userId);
    Object.assign(listing, {
      ...dto,
      location: this.createLocationPoint(dto) ?? listing.location,
    });
    return this.listingRepository.save(listing);
  }

  async remove(id: number, userId: number) {
    const listing = await this.validateListingOwnership(id, userId);
    listing.status = 'INACTIVE';
    return this.listingRepository.save(listing);
  }
}