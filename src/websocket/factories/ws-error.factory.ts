import { WsErrorResponseDto } from '../dto/responses/ws-error-response.dto';
import { 
  ConversationNotFoundException, 
  ConversationAccessDeniedException,
  MessageNotFoundException,
  MessageAccessDeniedException
} from '../../shared/exceptions/domain.exception';

export class WsErrorFactory {
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
    if (exception instanceof ConversationAccessDeniedException ||
        exception instanceof MessageAccessDeniedException) {
      return this.create('AccessDenied', exception.message, 403);
    }
    if (exception instanceof MessageNotFoundException) {
      return this.create('MessageNotFound', exception.message, 404);
    }
    return this.create('InternalError', exception.message, 500);
  }
}
