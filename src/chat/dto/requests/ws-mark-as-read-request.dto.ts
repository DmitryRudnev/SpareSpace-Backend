import { IsInt, IsOptional, Min, IsArray, ArrayMinSize } from 'class-validator';

export class WsMarkAsReadRequestDto {
  @IsInt()
  @Min(1)
  conversationId: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  messageIds?: number[];
}
