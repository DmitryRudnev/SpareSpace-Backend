import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { FavoriteMapper } from './mappers/favorite.mapper';

import { CreateFavoriteDto } from './dto/requests/create-favorite.dto';
import { SearchListingsDto } from '../listings/dto/requests/search-listings.dto';
import { FavoriteResponseDto } from './dto/responses/favorite-response.dto';
import { FavoritesListResponseDto } from './dto/responses/favorites-list-response.dto';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiTags('Favorites')
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить список избранного текущего пользователя',
    description: 'Возвращает пагинированный список избранных объявлений с фильтрацией. Требует аутентификации.',
  })
  @ApiQuery({
    name: 'searchDto',
    type: SearchListingsDto,
    required: false,
    description: 'Критерии фильтрации объявлений (тип, цена, геолокация и т.д.)',
  })
  @ApiOkResponse({
    description: 'Список избранных объявлений',
    type: FavoritesListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  async findAll(
    @Query() searchDto: SearchListingsDto,
    @User('userId') userId: number,
  ): Promise<FavoritesListResponseDto> {
    const result = await this.favoritesService.findAllByUser(userId, searchDto);
    return FavoriteMapper.toListResponseDto(
      result.favorites,
      result.total,
      result.limit,
      result.offset,
    );
  }


  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Добавить объявление в избранное',
    description: 'Добавляет объявление в избранное текущего пользователя. Требует аутентификации.',
  })
  @ApiBody({ type: CreateFavoriteDto, description: 'Данные для добавления в избранное' })
  @ApiCreatedResponse({
    description: 'Объявление успешно добавлено в избранное',
    type: FavoriteResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  @ApiConflictResponse({ description: 'Объявление уже в избранном' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async create(
    @Body() createFavoriteDto: CreateFavoriteDto,
    @User('userId') userId: number,
  ): Promise<FavoriteResponseDto> {
    const favorite = await this.favoritesService.create(createFavoriteDto.listingId, userId);
    return FavoriteMapper.toResponseDto(favorite);
  }

  
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить объявление из избранного по ID записи',
    description: 'Удаляет запись избранного по её ID. Требует аутентификации и владения записью.',
  })
  @ApiParam({ name: 'id', description: 'ID записи избранного', type: Number })
  @ApiNoContentResponse({ description: 'Запись успешно удалена из избранного' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован или доступ запрещен' })
  @ApiNotFoundResponse({ description: 'Запись избранного не найдена' })
  async remove(
    @Param('id') id: string,
    @User('userId') userId: number,
  ): Promise<void> {
    await this.favoritesService.remove(+id, userId);
  }
}
