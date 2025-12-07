import { IsInt, Min } from 'class-validator';

export class WsLeaveRoomRequestDto {
  @IsInt()
  @Min(1)
  conversationId: number;
}
