import { MessageResponseDto } from '../../../chat/dto/responses/message-response.dto';

export class WsEditMessageResponseDto {
  conversationId: number;
  
  message: MessageResponseDto;
}
