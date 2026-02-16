import { IsInt, Min } from 'class-validator';

export class WsUserStatusSubscribeRequestDto {
  @IsInt()
  @Min(1)
  userId: number;
}
