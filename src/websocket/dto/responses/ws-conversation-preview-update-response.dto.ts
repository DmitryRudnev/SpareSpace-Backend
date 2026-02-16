import { MessageResponseDto } from '../../../chat/dto/responses/message-response.dto';

export class WsConversationPreviewUpdateResponseDto {
  conversationId: number;
  unreadsCount: number;
  lastMessage: MessageResponseDto | null;
}
