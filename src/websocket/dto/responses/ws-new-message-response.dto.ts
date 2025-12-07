import { MessageResponseDto } from '../../../chat/dto/responses/message-response.dto';

export class WsNewMessageResponseDto {
  conversationId: number;
  
  message: MessageResponseDto;
}
