import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { UserToken } from '../entities/user-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRoleType } from '../common/enums/user-role-type.enum';

@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT_ROUNDS = 10;
  private readonly DEFAULT_USER_ROLE = UserRoleType.RENTER;

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserToken) private tokenRepository: Repository<UserToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UsersService,
  ) {}

  private getRefreshTokenExpiryMs(): number {
    const days = this.configService.get<number>('REFRESH_TOKEN_EXPIRY_DAYS', 7);
    return days * 24 * 60 * 60 * 1000;
  }

  private async checkEmailExists(email: string | undefined) {
    const exists = await this.userRepository.findOneBy({ email });
    if (exists) throw new ConflictException('Email already exists');
  }

  private async checkPhoneExists(phone: string) {
    const exists = await this.userRepository.findOneBy({ phone });
    if (exists) throw new ConflictException('Phone already exists');
  }

  private async createUser(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS);
    const user = this.userRepository.create({
      email: dto.email,
      phone: dto.phone,
      first_name: dto.first_name,
      last_name: dto.last_name,
      patronymic: dto.patronymic,
      password_hash: hash,
    });
    return this.userRepository.save(user);
  }

  private async hashRefreshToken(refreshToken: string) {
    const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
    return crypto
      .createHmac('sha256', refreshTokenSecret)
      .update(refreshToken)
      .digest('hex');
  }

  private async generateTokens(userId: number) {
    const roles = await this.userService.getUserRoles(userId);
    const payload = { sub: userId, roles };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    const refreshToken = crypto.randomBytes(64).toString('base64url');
    return { accessToken, refreshToken };
  }

  private async saveToken(userId: number, refreshToken: string) {
    const refreshTokenHash = await this.hashRefreshToken(refreshToken);
    await this.tokenRepository.save({
      user: { id: userId },
      refresh_token_hash: refreshTokenHash,
      expiry: new Date(Date.now() + this.getRefreshTokenExpiryMs()),
      revoked: false,
    });
  }

  private async validateUser(dto: LoginDto) {
    const user = await this.userRepository.findOneBy({ phone: dto.phone });
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async register(dto: RegisterDto) {
    await this.checkEmailExists(dto.email);
    await this.checkPhoneExists(dto.phone);
    const user = await this.createUser(dto);
    await this.userService.addRole(user.id, this.DEFAULT_USER_ROLE);
    const { accessToken, refreshToken } = await this.generateTokens(user.id);
    await this.saveToken(user.id, refreshToken);
    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);
    const { accessToken, refreshToken } = await this.generateTokens(user.id);
    await this.saveToken(user.id, refreshToken);
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const refreshTokenHash = await this.hashRefreshToken(refreshToken);
    const token = await this.tokenRepository.findOne({
      where: { refresh_token_hash: refreshTokenHash },
      relations: ['user']
    });

    if (!token || token.expiry < new Date() || token.revoked) throw new UnauthorizedException('Invalid or expired token');
    await this.tokenRepository.update(token.id, { revoked: true });

    if (!token.user) throw new UnauthorizedException('User not found');
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await this.generateTokens(token.user.id);
    await this.saveToken(token.user.id, newRefreshToken);
    return { newAccessToken, newRefreshToken };
  }

  async logout(refreshToken: string) {
    const refreshTokenHash = await this.hashRefreshToken(refreshToken);
    const token = await this.tokenRepository.findOne({
      where: { refresh_token_hash: refreshTokenHash },
      relations: ['user']
    });
    if (token) {
      await this.tokenRepository.update(token.id, { revoked: true });
    }
  }
}
