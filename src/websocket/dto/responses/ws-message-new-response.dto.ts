import { MessageResponseDto } from '../../../chat/dto/responses/message-response.dto';

export class WsMessageNewResponseDto {
  conversationId: number;
  message: MessageResponseDto;
}
