import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DevicesService } from '../../devices/devices.service';
import { AnyNotificationPayload } from '../../common/interfaces/notification-payloads.interface';
import { NotificationType } from '../../common/enums/notification-type.enum';

@Injectable()
export class FcmNotificationsService implements OnModuleInit {
  private readonly logger = new Logger(FcmNotificationsService.name);
  
  constructor(
    private readonly configService: ConfigService,
    private readonly devicesService: DevicesService,
  ) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const base64Config = this.configService.get<string>('FCM_CREDENTIALS_BASE64');
    
    if (!base64Config) {
      this.logger.warn('FCM credentials not found. Push notifications will be disabled.');
      return;
    }

    try {
      const config = JSON.parse(Buffer.from(base64Config, 'base64').toString());
      
      // Проверяем, не инициализировано ли уже приложение
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(config),
        });
        this.logger.log('Firebase initialized successfully');
      }
    } 
    catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
    }
  }


  async sendPush(
    tokens: string[], 
    title: string, 
    body: string, 
    type: NotificationType,
    payload?: AnyNotificationPayload
  ): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: tokens,
      notification: { title, body, },
      data: payload ? { 
        type,
        payload: JSON.stringify(payload) 
      } : { type },
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
      apns: { payload: { aps: { sound: 'default' } } },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(`FCM sent: ${response.successCount} successful, ${response.failureCount} failed`);

      if (response.failureCount > 0) {
        await this.handleFailedTokens(tokens, response);
      }
    } 
    catch (error) {
      this.logger.error('FCM Send Error:', error);
    }
  }


  private async handleFailedTokens(
    tokens: string[], 
    response: admin.messaging.BatchResponse
  ): Promise<void> {
    const invalidTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;

        if (this.isInvalidTokenError(errorCode)) {
          invalidTokens.push(tokens[idx]);
          this.logger.debug(`Invalid token found: ${tokens[idx]}, error: ${errorCode}`);
        }
      }
    });

    if (invalidTokens.length > 0) {
        await this.devicesService.deleteTokens(invalidTokens);
    }
  }


  private isInvalidTokenError(errorCode?: string): boolean {
    if (!errorCode) {
        return false;
    }

    const invalidTokenErrors = [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
      'messaging/not-registered',
    ];
    return invalidTokenErrors.includes(errorCode);
  }
}
