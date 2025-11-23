import { IsInt, Min } from 'class-validator';

export class WsJoinRoomRequestDto {
  @IsInt()
  @Min(1)
  conversationId: number;
}
