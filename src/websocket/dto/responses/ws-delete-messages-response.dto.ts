import { MessageResponseDto } from '../../../chat/dto/responses/message-response.dto';

export class WsDeleteMessagesResponseDto {
  conversationId: number;

  deletedMessageIds: number[];
}
