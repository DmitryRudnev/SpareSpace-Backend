import { IsInt, Min } from 'class-validator';

export class WsUserStatusUnsubscribeRequestDto {
  @IsInt()
  @Min(1)
  userId: number;
}
