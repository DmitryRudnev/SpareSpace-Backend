// src/notifications/services/notification-message-builder.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationType } from '../../common/enums/notification-type.enum';
import {
  AnyNotificationPayload,
  MessagePayload,
  BookingPayload,
  ListingPayload,
  ReviewPayload,
  PaymentPayload,
  SubscriptionPayload,
  LoginPayload,
} from '../../common/interfaces/notification-payloads.interface';

@Injectable()
export class NotificationMessageBuilder {
  /**
   * Основной метод формирования заголовка и тела уведомления.
   * @param type - тип уведомления
   * @param payload - данные уведомления
   * @returns объект с полями title и body
   */
  build(type: NotificationType, payload?: AnyNotificationPayload): { title: string; body: string } {
    switch (type) {
      // Сообщения
      case NotificationType.MESSAGE_NEW:
        return this.buildMessageNew(payload as MessagePayload | undefined);

      // Бронирования
      case NotificationType.BOOKING_NEW:
        return this.buildBookingNew(payload as BookingPayload | undefined);
      case NotificationType.BOOKING_CONFIRMED:
        return this.buildBookingConfirmed(payload as BookingPayload | undefined);
      case NotificationType.BOOKING_CANCELLED:
        return this.buildBookingCancelled(payload as BookingPayload | undefined);
      case NotificationType.BOOKING_REMINDER:
        return this.buildBookingReminder(payload as BookingPayload | undefined);
      case NotificationType.BOOKING_EXPIRING:
        return this.buildBookingExpiring(payload as BookingPayload | undefined);
      case NotificationType.BOOKING_COMPLETED:
        return this.buildBookingCompleted(payload as BookingPayload | undefined);

      // Объявления
      case NotificationType.LISTING_APPROVED:
        return this.buildListingApproved(payload as ListingPayload | undefined);
      case NotificationType.LISTING_REJECTED:
        return this.buildListingRejected(payload as ListingPayload | undefined);
      case NotificationType.LISTING_EXPIRING:
        return this.buildListingExpiring(payload as ListingPayload | undefined);
      case NotificationType.LISTING_EXPIRED:
        return this.buildListingExpired(payload as ListingPayload | undefined);

      // Отзывы
      case NotificationType.REVIEW_NEW:
        return this.buildReviewNew(payload as ReviewPayload | undefined);

      // Платежи
      case NotificationType.PAYMENT_SUCCESS:
        return this.buildPaymentSuccess(payload as PaymentPayload | undefined);
      case NotificationType.PAYMENT_FAILED:
        return this.buildPaymentFailed(payload as PaymentPayload | undefined);

      // Подписки
      case NotificationType.SUBSCRIPTION_STARTED:
        return this.buildSubscriptionStarted(payload as SubscriptionPayload | undefined);
      case NotificationType.SUBSCRIPTION_RENEWED:
        return this.buildSubscriptionRenewed(payload as SubscriptionPayload | undefined);
      case NotificationType.SUBSCRIPTION_EXPIRING:
        return this.buildSubscriptionExpiring(payload as SubscriptionPayload | undefined);
      case NotificationType.SUBSCRIPTION_EXPIRED:
        return this.buildSubscriptionExpired(payload as SubscriptionPayload | undefined);
      case NotificationType.SUBSCRIPTION_CANCELLED:
        return this.buildSubscriptionCancelled(payload as SubscriptionPayload | undefined);
      case NotificationType.SUBSCRIPTION_PAYMENT_FAILED:
        return this.buildSubscriptionPaymentFailed(payload as SubscriptionPayload | undefined);

      // Безопасность
      case NotificationType.LOGIN_NEW:
        return this.buildLoginNew(payload as LoginPayload | undefined);

      default:
        // На случай неизвестного типа – возвращаем заглушку
        return {
          title: 'Новое уведомление',
          body: type,
        };
    }
  }

  // ---------- Приватные методы для каждого типа ----------

  private buildMessageNew(payload?: MessagePayload): { title: string; body: string } {
    if (!payload) {
      return {
        title: 'Новое сообщение',
        body: 'У вас новое сообщение',
      };
    }
    const title = 'Новое сообщение';
    const text = this.truncate(payload.text || '', 100);
    const body = payload.listingTitle
      ? `Объявление: ${payload.listingTitle}\n${payload.senderName}: ${text}`
      : `${payload.senderName}: ${text}`;
    return { title, body };
  }

  private buildBookingNew(payload?: BookingPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Новое бронирование', body: 'Вам пришла новая заявка на бронирование' };
    }
    let body = `Объявление «${payload.listingTitle}» забронировано`;
    if (payload.price && payload.currency) {
      body += ` на сумму ${payload.price} ${payload.currency}`;
    }
    return { title: 'Новое бронирование', body };
  }

  private buildBookingConfirmed(payload?: BookingPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Бронирование подтверждено', body: 'Ваше бронирование подтверждено' };
    }
    return {
      title: 'Бронирование подтверждено',
      body: `Ваше бронирование для «${payload.listingTitle}» подтверждено.`,
    };
  }

  private buildBookingCancelled(payload?: BookingPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Бронирование отменено', body: 'Ваше бронирование отменено' };
    }
    return {
      title: 'Бронирование отменено',
      body: `Бронирование для «${payload.listingTitle}» отменено.`,
    };
  }

  private buildBookingReminder(payload?: BookingPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Напоминание о бронировании', body: 'У вас скоро бронирование' };
    }
    const dateStr = payload.startDate ? new Date(payload.startDate).toLocaleDateString('ru-RU') : 'скоро';
    return {
      title: 'Напоминание о бронировании',
      body: `Напоминаем: бронирование «${payload.listingTitle || ''}» начнётся ${dateStr}.`,
    };
  }

  private buildBookingExpiring(payload?: BookingPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Бронирование скоро истекает', body: 'Срок бронирования подходит к концу' };
    }
    return {
      title: 'Бронирование скоро истекает',
      body: `Бронирование «${payload.listingTitle}» заканчивается. Не забудьте продлить или завершить.`,
    };
  }

  private buildBookingCompleted(payload?: BookingPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Бронирование завершено', body: 'Бронирование завершено' };
    }
    return {
      title: 'Бронирование завершено',
      body: `Бронирование «${payload.listingTitle}» завершено. Оставьте отзыв!`,
    };
  }

  private buildListingApproved(payload?: ListingPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Объявление одобрено', body: 'Ваше объявление прошло модерацию' };
    }
    return {
      title: 'Объявление одобрено',
      body: `Ваше объявление «${payload.listingTitle}» прошло модерацию и опубликовано.`,
    };
  }

  private buildListingRejected(payload?: ListingPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Объявление отклонено', body: 'Ваше объявление отклонено' };
    }
    const reason = payload.reason ? ` Причина: ${payload.reason}` : '';
    return {
      title: 'Объявление отклонено',
      body: `Объявление «${payload.listingTitle}» отклонено модерацией.${reason}`,
    };
  }

  private buildListingExpiring(payload?: ListingPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Скоро истекает срок размещения', body: 'Срок размещения объявления скоро истекает' };
    }
    return {
      title: 'Скоро истекает срок размещения',
      body: `Срок размещения объявления «${payload.listingTitle}» истекает. Продлите, чтобы не потерять просмотры.`,
    };
  }

  private buildListingExpired(payload?: ListingPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Срок размещения истек', body: 'Срок размещения объявления истек' };
    }
    return {
      title: 'Срок размещения истек',
      body: `Объявление «${payload.listingTitle}» снято с публикации.`,
    };
  }

  private buildReviewNew(payload?: ReviewPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Новый отзыв', body: 'Вам оставили новый отзыв' };
    }
    return {
      title: 'Новый отзыв',
      body: `${payload.fromUserName} оставил отзыв на «${payload.listingTitle}». Оценка: ${payload.rating}/5.`,
    };
  }

  private buildPaymentSuccess(payload?: PaymentPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Платёж успешен', body: 'Платёж прошёл успешно' };
    }
    return {
      title: 'Платёж успешен',
      body: `Платёж на сумму ${payload.amount} ${payload.currency} прошёл успешно.`,
    };
  }

  private buildPaymentFailed(payload?: PaymentPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Ошибка платежа', body: 'Не удалось провести платёж' };
    }
    const desc = payload.description ? ` Причина: ${payload.description}` : '';
    return {
      title: 'Ошибка платежа',
      body: `Не удалось провести платёж на сумму ${payload.amount} ${payload.currency}.${desc}`,
    };
  }

  private buildSubscriptionStarted(payload?: SubscriptionPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Подписка оформлена', body: 'Подписка успешно оформлена' };
    }
    return {
      title: 'Подписка оформлена',
      body: `Подписка «${payload.planName}» активирована.`,
    };
  }

  private buildSubscriptionRenewed(payload?: SubscriptionPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Подписка продлена', body: 'Подписка успешно продлена' };
    }
    const end = payload.endDate ? new Date(payload.endDate).toLocaleDateString('ru-RU') : 'неизвестно';
    return {
      title: 'Подписка продлена',
      body: `Подписка «${payload.planName}» продлена до ${end}.`,
    };
  }

  private buildSubscriptionExpiring(payload?: SubscriptionPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Подписка скоро истечёт', body: 'Срок подписки подходит к концу' };
    }
    const end = payload.endDate ? new Date(payload.endDate).toLocaleDateString('ru-RU') : 'скоро';
    return {
      title: 'Подписка скоро истечёт',
      body: `Подписка «${payload.planName}» истекает ${end}. Продлите сейчас.`,
    };
  }

  private buildSubscriptionExpired(payload?: SubscriptionPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Подписка истекла', body: 'Срок подписки истёк' };
    }
    return {
      title: 'Подписка истекла',
      body: `Срок действия подписки «${payload.planName}» истёк.`,
    };
  }

  private buildSubscriptionCancelled(payload?: SubscriptionPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Подписка отменена', body: 'Подписка отменена' };
    }
    return {
      title: 'Подписка отменена',
      body: `Подписка «${payload.planName}» отменена.`,
    };
  }

  private buildSubscriptionPaymentFailed(payload?: SubscriptionPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Ошибка оплаты подписки', body: 'Не удалось списать оплату за подписку' };
    }
    return {
      title: 'Ошибка оплаты подписки',
      body: `Не удалось списать оплату за подписку «${payload.planName}». Проверьте способ оплаты.`,
    };
  }

  private buildLoginNew(payload?: LoginPayload): { title: string; body: string } {
    if (!payload) {
      return { title: 'Новый вход в аккаунт', body: 'Выполнен вход с нового устройства' };
    }
    const time = payload.time ? ` в ${new Date(payload.time).toLocaleString('ru-RU')}` : '';
    return {
      title: 'Новый вход в аккаунт',
      body: `Выполнен вход с нового устройства: ${payload.deviceInfo}${time}. Если это были не вы, смените пароль.`,
    };
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}
