import { IsInt, Min } from 'class-validator';

export class WsConversationUnsubscribeRequestDto {
  @IsInt()
  @Min(1)
  conversationId: number;
}
