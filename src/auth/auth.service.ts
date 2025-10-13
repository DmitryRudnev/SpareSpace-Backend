import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserToken } from '../entities/user-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT_ROUNDS = 10;
  private readonly DEFAULT_USER_ROLE = 'RENTER';

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserToken) private tokenRepository: Repository<UserToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private getRefreshTokenExpiryMs(): number {
    const days = this.configService.get<number>('REFRESH_TOKEN_EXPIRY_DAYS', 7);
    return days * 24 * 60 * 60 * 1000;
  }

  private async checkEmailExists(email: string) {
    const exists = await this.userRepository.findOneBy({ email });
    if (exists) throw new ConflictException('Email already exists');
  }

  private async createUser(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS);
    const user = this.userRepository.create({
      email: dto.email,
      password_hash: hash,
      full_name: dto.full_name,
      role: this.DEFAULT_USER_ROLE,
    });
    return this.userRepository.save(user);
  }

  private async generateTokens(user: User) {
    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      }
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN'),
      },
    );
    return { accessToken, refreshToken };
  }

  private async saveTokens(userId: number, accessToken: string, refreshToken: string) {
    await this.tokenRepository.save({
      user_id: userId,
      refresh_token: refreshToken,
      access_token: accessToken,
      expiry: new Date(Date.now() + this.getRefreshTokenExpiryMs()),
    });
  }

  async register(dto: RegisterDto) {
    await this.checkEmailExists(dto.email);
    const user = await this.createUser(dto);
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveTokens(user.id, accessToken, refreshToken);
    return { accessToken, refreshToken };
  }

  private async validateUser(dto: LoginDto) {
    const user = await this.userRepository.findOneBy({ email: dto.email });
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveTokens(user.id, accessToken, refreshToken);
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const token = await this.tokenRepository.findOneBy({ refresh_token: refreshToken });
    if (!token || token.expiry < new Date()) throw new UnauthorizedException('Invalid or expired token');
    const user = await this.userRepository.findOneBy({ id: token.user_id });
    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      }
    );
    return { accessToken };
  }
}