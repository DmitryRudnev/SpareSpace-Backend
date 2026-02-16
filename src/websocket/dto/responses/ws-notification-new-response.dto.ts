import { NotificationType } from "../../../common/enums/notification-type.enum";
import { AnyNotificationPayload } from "../../../common/interfaces/notification-payloads.interface";

export class WsNotificationNewResponseDto {
  id: number;
  title: string;
  body: string;
  type: NotificationType;
  referenceId?: number;
  payload?: AnyNotificationPayload;
  createdAt: string;
}
