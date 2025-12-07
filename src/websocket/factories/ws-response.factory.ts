import { WsResponseDto } from '../dto/responses';
import { WsErrorFactory } from './ws-error.factory';

export class WsResponseFactory {
  static success(): WsResponseDto {
    return { success: true };
  }

  static successWithData(data: any): WsResponseDto {
    return { success: true, data };
  }

  static error(error: Error): WsResponseDto {
    return { success: false, error: WsErrorFactory.fromException(error) };
  }
}
