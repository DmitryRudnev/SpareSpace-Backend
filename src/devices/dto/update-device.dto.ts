import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDeviceDto {
  @ApiProperty({
    description: 'FCM токен, полученный от Firebase на мобильном устройстве',
    example: 'fcm_token_1234567890'
  })
  @IsNotEmpty()
  @IsString()
  fcmToken: string;

  @ApiProperty({
    description: 'Уникальный ID устройства (генерируется фронтендом)',
    example: 'uuid-device-id-9876'
  })
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @ApiPropertyOptional({
    description: 'Платформа устройства',
    example: 'android',
    enum: ['ios', 'android', 'web']
  })
  @IsOptional()
  @IsString()
  platform?: string;
}
