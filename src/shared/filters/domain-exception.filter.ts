import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  HttpStatus 
} from '@nestjs/common';
import { Response } from 'express';
import { 
  ConversationNotFoundException, 
  ConversationAccessDeniedException,
  MessageNotFoundException
} from '../exceptions/domain.exception';

@Catch(
  ConversationNotFoundException,
  ConversationAccessDeniedException
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: HttpStatus;
    let message: string;

    if (exception instanceof ConversationNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    } else if (exception instanceof ConversationAccessDeniedException) {
      status = HttpStatus.FORBIDDEN;
      message = exception.message;
    } else if (exception instanceof MessageNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url
    });
  }
}
