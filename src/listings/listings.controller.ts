import { Controller, Post, Body, Get, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { User } from '../common/decorators/user.decorator';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createListingDto: CreateListingDto, @User('userId') userId: number) {
    return this.listingsService.create(createListingDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto, @User('userId') userId: number) {
    return this.listingsService.update(+id, updateListingDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @User('userId') userId: number) {
    return this.listingsService.remove(+id, userId);
  }

  @Get()
  findAll(@Query() searchDto: SearchListingsDto) {
    return this.listingsService.findAll(searchDto);
  }

  @UseGuards(OptionalJwtGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @User('userId') userId?: number) {
    return this.listingsService.findOne(+id, userId);
  }

  @UseGuards(OptionalJwtGuard)
  @Get('user/:id')
  findByUser(@Param('id') userId: string, @Query() searchDto: SearchListingsDto, @User('userId') currentUserId?: number) {
    return this.listingsService.findByUser(+userId, searchDto, currentUserId);
  }
}
