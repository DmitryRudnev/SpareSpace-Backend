import { IsInt, IsArray, ArrayMinSize, Min } from 'class-validator';

export class WsMessageDeleteRequestDto {
  @IsInt()
  @Min(1)
  conversationId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  messageIds: number[];
}
