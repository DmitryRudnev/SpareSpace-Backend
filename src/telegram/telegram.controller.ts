import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Logger, 
  Get, 
  Delete,
  HttpCode,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiOkResponse, 
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiBody
} from '@nestjs/swagger';
import { TelegramWebhookGuard } from './guards/telegram-webhook.guard';
import { TelegramService } from './services/telegram.service';
import { TelegramAccountService } from './services/telegram-account.service';
import type { TelegramWebhookUpdate } from './interfaces';
import { GenerateTelegramLinkResponseDto } from './dto/generate-telegram-link-response.dto';
import { UnlinkTelegramAccountRequestDto } from './dto/unlink-telegram-account-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramAccountService: TelegramAccountService,
  ) {}


  @Post('webhook')
  @UseGuards(TelegramWebhookGuard)
  async handleWebhook(@Body() update: TelegramWebhookUpdate): Promise<{ status: string }> {
    this.telegramService.handleUpdate(update);
    return { status: 'ok' };
  }


  @Get('link')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Получить ссылку для привязки Telegram аккаунта',
    description: 'Генерирует уникальную ссылку для привязки Telegram аккаунта к пользователю'
  })
  @ApiOkResponse({ 
    description: 'Ссылка успешно сгенерирована',
    type: GenerateTelegramLinkResponseDto
  })
  async generateTelegramLink(
    @User('userId') currentUserId: number
  ): Promise<GenerateTelegramLinkResponseDto> {
    const link = await this.telegramAccountService.generateTelegramLink(currentUserId);
    return { link };
  }


  @Delete('unlink')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Отвязать Telegram аккаунт',
    description: 'Отвязывает Telegram аккаунт от пользователя'
  })
  @ApiBody({ type: UnlinkTelegramAccountRequestDto, description: 'ID Telegram аккаунта' })
  @ApiNoContentResponse({ 
    description: 'Telegram аккаунт успешно отвязан' 
  })
  @ApiConflictResponse({ 
    description: 'Указанный Telegram аккаунт не привязан к пользователю' 
  })
  async unlinkTelegramAccount(
    @User('userId') currentUserId: number,
    @Body() unlinkDto: UnlinkTelegramAccountRequestDto
  ): Promise<void> {
    await this.telegramAccountService.unlinkTelegramAccount(currentUserId, unlinkDto.telegramId);
  }
}
