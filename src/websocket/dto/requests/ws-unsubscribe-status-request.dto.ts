import { IsInt, Min } from 'class-validator';

export class WsUnsubscribeStatusRequestDto {
  @IsInt()
  @Min(1)
  userId: number;
}
