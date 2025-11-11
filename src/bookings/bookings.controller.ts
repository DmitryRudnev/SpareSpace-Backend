import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { SearchBookingsDto } from './dto/search-bookings.dto';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AtLeastOneFieldPipe } from './pipes/at-least-one-field.pipe';
import { Booking } from '../entities/booking.entity';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Не авторизован' })
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Создание нового бронирования',
    description:
      'Создаёт бронирование на основе предоставленных данных. Требует аутентификации и роли арендатора.',
  })
  @ApiBody({ type: CreateBookingDto, description: 'Данные для создания бронирования' })
  @ApiCreatedResponse({ description: 'Бронирование успешно создано', type: Booking })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  @ApiConflictResponse({ description: 'Конфликт: объект недоступен для бронирования' })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @User('userId') userId: number,
  ): Promise<Booking> {
    return this.bookingsService.create(createBookingDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Получение списка бронирований с поиском',
    description: 'Возвращает список бронирований с фильтрацией по статусу. Требует аутентификации.',
  })
  @ApiQuery({
    name: 'searchDto',
    type: SearchBookingsDto,
    required: false,
    description: 'Критерии поиска (статус, пагинация)',
  })
  @ApiOkResponse({
    description: 'Список бронирований пользователя',
    type: [Booking],
  })
  async findAll(
    @Query() searchDto: SearchBookingsDto, 
    @User('userId') userId: number
    ): Promise<{ bookings: Booking[]; total: number; limit: number; offset: number; }> {
    return this.bookingsService.findAll(searchDto, userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получение одного бронирования',
    description:
      'Возвращает детали бронирования по ID. Требует аутентификации и участия в бронировании.',
  })
  @ApiParam({ name: 'id', description: 'ID бронирования', type: Number })
  @ApiOkResponse({ description: 'Бронирование найдено', type: Booking })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  async findOne(@Param('id') id: string): Promise<Booking> {
    return this.bookingsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновление бронирования',
    description:
      'Обновляет существующее бронирование. Только для арендатора и только pending-бронирований.',
  })
  @ApiParam({ name: 'id', description: 'ID бронирования для обновления', type: Number })
  @ApiBody({ type: UpdateBookingDto, description: 'Данные для обновления' })
  @ApiOkResponse({ description: 'Бронирование успешно обновлено', type: Booking })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  @ApiConflictResponse({ description: 'Конфликт: объект недоступен для новых дат' })
  async update(
    @Param('id') id: string,
    @Body(AtLeastOneFieldPipe) updateBookingDto: UpdateBookingDto,
    @User('userId') userId: number,
  ): Promise<Booking> {
    return this.bookingsService.update(+id, updateBookingDto, userId);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Изменение статуса бронирования',
    description: 'Изменяет статус бронирования. Только для владельца объекта.',
  })
  @ApiParam({ name: 'id', description: 'ID бронирования', type: Number })
  @ApiBody({ type: ChangeStatusDto, description: 'Новый статус бронирования' })
  @ApiOkResponse({ description: 'Статус успешно изменён', type: Booking })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  @ApiBadRequestResponse({ description: 'Некорректный статус или операция' })
  async changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @User('userId') userId: number,
  ): Promise<Booking> {
    return this.bookingsService.changeStatus(+id, changeStatusDto.status, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Отмена бронирования',
    description: 'Выполняет отмену бронирования. Доступно для арендатора или владельца объекта.',
  })
  @ApiParam({ name: 'id', description: 'ID бронирования для отмены', type: Number })
  @ApiNoContentResponse({ description: 'Бронирование успешно отменено' })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  @ApiBadRequestResponse({ description: 'Невозможно отменить бронирование' })
  async remove(@Param('id') id: string, @User('userId') userId: number): Promise<void> {
    await this.bookingsService.remove(+id, userId);
  }
}
