import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { UpdateDeviceDto } from './dto/update-device.dto';

@ApiTags('Devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Регистрация или обновление токена устройства',
    description: 'Сохраняет FCM токен для текущего пользователя. Вызывается фронтендом при запуске приложения или обновлении токена Firebase.'
  })
  @ApiOkResponse({
    description: 'Токен успешно сохранен'
  })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async updateDevice(
    @User('userId') userId: number,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    await this.devicesService.upsertDevice(userId, updateDeviceDto);
    return { success: true };
  }
}
