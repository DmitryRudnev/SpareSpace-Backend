import { IsInt, Min } from 'class-validator';

export class WsSubscribeStatusRequestDto {
  @IsInt()
  @Min(1)
  userId: number;
}
