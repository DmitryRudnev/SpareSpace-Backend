import { MessageResponseDto } from '../../../chat/dto/responses/message-response.dto';

export class WsLastMessageResponseDto {
  conversationId: number;
  
  lastMessage: MessageResponseDto | null;
}
