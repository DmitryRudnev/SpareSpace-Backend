import { IsInt, IsString, Min, Length } from 'class-validator';

export class WsMessageSendRequestDto {
  @IsInt()
  @Min(1)
  conversationId: number;

  @IsString()
  @Length(1, 1000)
  text: string;
}