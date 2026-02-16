import { MessageResponseDto } from '../../../chat/dto/responses/message-response.dto';

export class WsMessageEditedResponseDto {
  conversationId: number;
  message: MessageResponseDto;
}
