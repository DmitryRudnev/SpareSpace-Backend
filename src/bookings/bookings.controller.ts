import { Controller, Post, Body, Get, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { SearchBookingsDto } from './dto/search-bookings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @User('userId') userId: number) {
    return this.bookingsService.create(createBookingDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() searchDto: SearchBookingsDto, @User('userId') userId: number) {
    return this.bookingsService.findAll(searchDto, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto, @User('userId') userId: number) {
    return this.bookingsService.update(+id, updateBookingDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() changeStatusDto: ChangeStatusDto, @User('userId') userId: number) {
    return this.bookingsService.changeStatus(+id, changeStatusDto.status, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @User('userId') userId: number) {
    return this.bookingsService.remove(+id, userId);
  }
}