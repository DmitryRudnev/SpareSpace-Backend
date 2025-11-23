import { Injectable } from '@nestjs/common';
import { WsErrorResponseDto } from '../dto/responses/ws-error-response.dto';
import { 
  ConversationNotFoundException, 
  ConversationAccessDeniedException,
  MessageNotFoundException
} from '../../shared/exceptions/domain.exception';

@Injectable()
export class ErrorResponseFactory {
  static create(
    type: string,
    message: string, 
    code?: number,
    details?: any
  ): WsErrorResponseDto {
    return {
      type,
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    };
  }

  static fromException(exception: Error): WsErrorResponseDto {
    if (exception instanceof ConversationNotFoundException) {
      return this.create('ConversationNotFound', exception.message, 404);
    }
    if (exception instanceof ConversationAccessDeniedException) {
      return this.create('AccessDenied', exception.message, 403);
    }
    if (exception instanceof MessageNotFoundException) {
      return this.create('MessageNotFound', exception.message, 404);
    }
    return this.create('InternalError', 'Internal server error', 500);
  }
}
