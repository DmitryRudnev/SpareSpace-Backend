import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from '../auth/dto/requests/register.dto';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Telegraf;
  private readonly BOT_TOKEN?: string;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private usersService: UsersService,
  ) {
    this.BOT_TOKEN = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    
    if (!this.BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
    }

    this.bot = new Telegraf(this.BOT_TOKEN);
  }

  async onModuleInit() {
    this.setupHandlers();
    await this.launchBot();
  }

  private setupHandlers() {
    // Команда /start
    this.bot.start((ctx) => this.handleStart(ctx));

    // Команда /login - авторизация через телефон
    this.bot.command('login', (ctx) => this.handleLogin(ctx));

    // Команда /profile - получение профиля
    this.bot.command('profile', (ctx) => this.handleProfile(ctx));

    // Обработчик текстовых сообщений (для ввода телефона)
    this.bot.on('text', (ctx) => this.handleTextMessage(ctx));

    // Обработчик контактов (если пользователь делится контактом)
    this.bot.on('contact', (ctx) => this.handleContact(ctx));

    // Обработчик ошибок
    this.bot.catch((err, ctx) => {
      this.logger.error(`Telegraf error for ${ctx.updateType}:`, err);
      ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    });
  }

  private async launchBot() {
    try {
      await this.bot.launch();
      this.logger.log('Telegram Bot started successfully');
      
      // Enable graceful stop
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    } catch (error) {
      this.logger.error('Failed to start Telegram Bot:', error);
    }
  }

  private async handleStart(ctx: Context) {
    const user = ctx.from as TelegramUser;
    
    const welcomeMessage = `
👋 Привет, ${user.first_name}!

Добро пожаловать в Spare Space Bot!

Доступные команды:
/login - Войти или зарегистрироваться
/profile - Получить свой профиль

Для начала работы используйте /login для авторизации.
    `.trim();

    await ctx.reply(welcomeMessage);
  }

  private async handleLogin(ctx: Context) {
    const user = ctx.from as TelegramUser;
    
    const loginMessage = `
🔐 Авторизация

Для входа или регистрации введите ваш номер телефона в формате:
+79991234567

Или поделитесь контактом, используя кнопку ниже.
    `.trim();

    await ctx.reply(loginMessage, {
      reply_markup: {
        keyboard: [
          [
            {
              text: '📱 Поделиться контактом',
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  private async handleTextMessage(ctx: Context) {
    const message = (ctx.message as any).text;
    const user = ctx.from as TelegramUser;

    // Проверяем, является ли сообщение номером телефона
    if (this.isPhoneNumber(message)) {
      await this.processPhoneLogin(user, message, ctx);
    } else {
      await ctx.reply('Пожалуйста, введите номер телефона в формате +79991234567 или используйте кнопку "Поделиться контактом"');
    }
  }

  private async handleContact(ctx: Context) {
    const contact = (ctx.message as any).contact;
    const user = ctx.from as TelegramUser;

    if (contact.phone_number) {
      await this.processPhoneLogin(user, contact.phone_number, ctx);
    } else {
      await ctx.reply('Не удалось получить номер телефона из контакта');
    }
  }

  private async handleProfile(ctx: Context) {
    const user = ctx.from as TelegramUser;
    
    try {
      // Ищем пользователя по telegramId
      const existingUser = await this.findUserByTelegramId(user.id);
      
      if (!existingUser) {
        await ctx.reply('❌ Вы не авторизованы. Используйте /login для входа.');
        return;
      }

      const profileMessage = `
👤 Ваш профиль:

📧 Email: ${existingUser.email}
📞 Телефон: ${existingUser.phone}
👤 Имя: ${existingUser.firstName} ${existingUser.lastName}
⭐ Рейтинг: ${existingUser.rating || 'еще нет оценок'}
✅ Верифицирован: ${existingUser.verified ? 'Да' : 'Нет'}
      `.trim();

      await ctx.reply(profileMessage);
    } catch (error) {
      this.logger.error('Error getting profile:', error);
      await ctx.reply('❌ Произошла ошибка при получении профиля');
    }
  }

  private async processPhoneLogin(telegramUser: TelegramUser, phone: string, ctx: Context) {
    try {
      // Очищаем номер телефона
      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
      
      // Проверяем существование пользователя по телефону
      const existingUser = await this.findUserByPhone(cleanedPhone);
      
      let user;
      let isNewUser = false;

      if (existingUser) {
        // Пользователь существует - обновляем telegramId
        user = await this.updateUserTelegramId(existingUser.id, telegramUser.id);
        await ctx.reply('✅ Вы успешно вошли в систему!');
      } else {
        // Регистрируем нового пользователя
        isNewUser = true;
        user = await this.registerNewUser(telegramUser, cleanedPhone);
        await ctx.reply('🎉 Добро пожаловать! Вы успешно зарегистрированы!');
      }

      // Показываем информацию о пользователе
      const userInfo = `
📋 Информация о аккаунте:

👤 Имя: ${user.firstName} ${user.lastName}
📧 Email: ${user.email}
📞 Телефон: ${user.phone}
${isNewUser ? '🆕 Новый пользователь' : '👋 С возвращением!'}

Используйте /profile для просмотра полной информации.
      `.trim();

      await ctx.reply(userInfo);

    } catch (error) {
      this.logger.error('Login error:', error);
      
      if (error.message.includes('already exists')) {
        await ctx.reply('❌ Этот номер телефона уже используется другим пользователем');
      } else {
        await ctx.reply('❌ Произошла ошибка при авторизации. Пожалуйста, попробуйте позже.');
      }
    }
  }

  private async findUserByPhone(phone: string) {
    // В реальной реализации нужно добавить метод в UsersService
    // Пока используем существующий функционал
    const users = await this.usersService['userRepository'].find({
      where: { phone }
    });
    return users.length > 0 ? users[0] : null;
  }

  private async findUserByTelegramId(telegramId: number) {
    // В реальной реализации нужно добавить поле telegramId в User entity
    // Пока используем временное решение
    const users = await this.usersService['userRepository'].find({
      where: { 
        // Ищем по email, сгенерированному из telegramId (временное решение)
        email: `telegram_${telegramId}@spacespace.com`
      }
    });
    return users.length > 0 ? users[0] : null;
  }

  private async updateUserTelegramId(userId: number, telegramId: number) {
    // В реальной реализации нужно добавить поле telegramId в User entity
    // Пока просто возвращаем пользователя
    return await this.usersService.findById(userId);
  }

  private async registerNewUser(telegramUser: TelegramUser, phone: string) {
    const registerDto: RegisterDto = {
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name || 'User',
      phone: phone,
      email: `telegram_${telegramUser.id}@spacespace.com`, // Генерируем email из telegramId
      password: this.generateRandomPassword(), // Генерируем случайный пароль
    };

    // Используем AuthService для регистрации
    const authResponse = await this.authService.register(registerDto);
    
    // Возвращаем информацию о пользователе
    return await this.usersService.findById(
      this.extractUserIdFromToken(authResponse.accessToken)
    );
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-8) + 'A1!'; // Простой генератор пароля
  }

  private extractUserIdFromToken(token: string): number {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      return parseInt(payload.sub, 10);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  private isPhoneNumber(text: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(text.replace(/[\s\-\(\)]/g, ''));
  }

  // Метод для отправки сообщений пользователю (может пригодиться для уведомлений)
  async sendMessage(telegramId: number, message: string) {
    try {
      await this.bot.telegram.sendMessage(telegramId, message);
    } catch (error) {
      this.logger.error(`Failed to send message to ${telegramId}:`, error);
    }
  }
}
