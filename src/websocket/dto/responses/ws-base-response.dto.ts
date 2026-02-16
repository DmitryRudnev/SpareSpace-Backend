import { WsErrorResponseDto } from './ws-error-response.dto';

export class WsResponseDto {
  success: boolean;
  data?: any;
  error?: WsErrorResponseDto;
}
