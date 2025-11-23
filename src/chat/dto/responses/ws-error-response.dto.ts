export class WsErrorResponseDto {
  type: string;

  message: string;

  code?: number;

  details?: any;

  timestamp: string;
}
