import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { AuthenticatedSocket } from '../interfaces/socket.interface';
import { WsErrorFactory } from '../factories/ws-error.factory';


@Catch()
export class WsExceptionsFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<AuthenticatedSocket>();
    const errorResponse = WsErrorFactory.fromException(exception);

    this.logger.error(
      `Ошибка WS [User: ${client.data?.user?.userId}]: ${JSON.stringify(errorResponse)}`
    );

    client.emit('error', errorResponse);
  }
}
