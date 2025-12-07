import { IsInt, IsString, Min, Length } from 'class-validator';

export class WsEditMessageRequestDto {
  @IsInt()
  @Min(1)
  conversationId: number;

  @IsInt()
  @Min(1)
  messageId: number;

  @IsString()
  @Length(1, 1000)
  newText: string;
}
