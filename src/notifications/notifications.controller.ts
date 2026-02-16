import { Controller, Get, Body, Param, Query, UseGuards, Patch, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './services/notifications.service';
import { SearchNotificationsDto } from './dto/requests/search-notifications.dto';
import { MarkAsReadDto } from './dto/requests/mark-as-read.dto';
import { NotificationResponseDto } from './dto/responses/notification-response.dto';
import { NotificationListResponseDto } from './dto/responses/notification-list-response.dto';
import { NotificationMapper } from './mappers/notification.mapper';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Получить список уведомлений текущего пользователя' })
  @ApiQuery({ type: SearchNotificationsDto }) // Автоматически развернет поля DTO в параметры запроса
  @ApiResponse({ status: 200, type: NotificationListResponseDto })
  async findAll(
    @Query() searchDto: SearchNotificationsDto, 
    @User('userId') userId: number
  ): Promise<NotificationListResponseDto> {
    const { notifications, total, limit, offset } = await this.notificationsService.findAll(userId, searchDto);
    return NotificationMapper.toListResponseDto(notifications, total, limit, offset);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Получить детальную информацию об уведомлении' })
  @ApiParam({ name: 'id', description: 'ID уведомления', example: 1 })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
  async findById(
    @Param('id') id: string,
    @User('userId') userId: number,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.findById(+id, userId);
    return NotificationMapper.toResponseDto(notification);
  }
  
  @Patch(':id/read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Пометить уведомление (и дополнительные ID) как прочитанные' })
  @ApiParam({ name: 'id', description: 'ID основного уведомления', example: 1 })
  @ApiResponse({ status: 200, description: 'Статус успешно обновлен' })
  async markAsRead(
    @Param('id') id: string,
    @User('userId') userId: number,
    @Body() dto: MarkAsReadDto,
  ): Promise<void> {
    await this.notificationsService.markAsRead(+id, userId, dto);
  }
}
