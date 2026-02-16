import { IsInt, Min } from 'class-validator';

export class WsConversationSubscribeRequestDto {
  @IsInt()
  @Min(1)
  conversationId: number;
}
