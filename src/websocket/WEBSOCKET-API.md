# WebSocket API документация

## 1. Общая информация

- **URL подключения:** `ws://<host>/` или `wss://<host>/` (в зависимости от окружения)
- **Протокол:** WebSocket (с поддержкой polling как fallback)
- **Транспорты:** `websocket`, `polling`
- **Пинг/понг:** сервер отправляет ping каждые 10 секунд, таймаут соединения — 30 секунд

## 2. Аутентификация

Для установки соединения необходимо передать JWT access token. Токен может быть передан одним из способов (в порядке приоритета):

- в поле `auth.token` при инициализации сокета (рекомендуется)
- в заголовке `Authorization: Bearer <token>`
- в query-параметре `token`

Если токен не передан или невалиден, соединение будет разорвано с ошибкой аутентификации.

После успешной аутентификации сокет ассоциируется с конкретным пользователем. Все последующие запросы от этого сокета будут выполняться от имени этого пользователя.

## 3. Общий формат сообщений

### Запросы от клиента

Клиент отправляет сообщение с именем события (event name) и данными (объект). Формат данных определяется DTO, описанными ниже.

### Ответы сервера на запросы

На каждое событие, отправленное клиентом, сервер отвечает объектом типа `WsResponseDto` (если не указано иное):

```typescript
{
  success: boolean;           // true — успех, false — ошибка
  data?: any;                 // может присутствовать при success = true
  error?: WsErrorResponseDto; // присутствует при success = false
}
```

**WsErrorResponseDto**:

```typescript
{
  type: string;       // тип ошибки, например "ConversationNotFound"
  message: string;    // описание ошибки
  code?: number;      // HTTP-подобный код (404, 403, 500...)
  details?: any;      // дополнительные детали
  timestamp: string;  // ISO дата
}
```

### События, инициируемые сервером (broadcast)

Сервер самостоятельно отправляет события определенным клиентам (например, при новом сообщении, изменении статуса пользователя). Эти события не являются ответом на конкретный запрос и должны обрабатываться на клиенте подпиской на соответствующие имена событий.

## 4. Комнаты (rooms)

Сервер использует комнаты для групповой рассылки:

- `user:{userId}` — комната пользователя, куда попадают все его сокеты после подключения. Используется для отправки персональных уведомлений.
- `conversation:{conversationId}` — комната беседы (чата). Чтобы получать события беседы, клиент должен подписаться на неё через `conversation:subscribe`.
- `user:status:{userId}` — комната для отслеживания статуса конкретного пользователя. Подписка через `user:status:subscribe`.

## 5. События клиент → сервер

### conversation:subscribe
Подписка на комнату беседы для получения событий этой беседы.

**Запрос** (`WsConversationSubscribeRequestDto`):
```typescript
{
  conversationId: number;
}
```

**Успешный ответ**:
```json
{
  "success": true
}
```

**Возможные ошибки**: `ConversationNotFound` (404), `AccessDenied` (403) — если у пользователя нет доступа к беседе.

---

### conversation:unsubscribe
Отписка от комнаты беседы.

**Запрос** (`WsConversationUnsubscribeRequestDto`):
```typescript
{
  conversationId: number;
}
```

**Успешный ответ**:
```json
{ "success": true }
```

**Ошибки**: обычно не возникают, но могут быть связаны с внутренними проблемами.

---

### message:send
Отправка сообщения в беседу.

**Запрос** (`WsMessageSendRequestDto`):
```typescript
{
  conversationId: number;
  text: string; // длина от 1 до 1000 символов
}
```

**Успешный ответ** (с данными):
```json
{
  "success": true,
  "data": {
    "message": {
      "id": 1,
      "sender": {
        "id": 1,
        "firstName": "Иван",
        "lastName": "Иванов",
        "patronymic": "Иванович",
        "rating": 4.8,
        "verified": true,
        "isOnline": true,
        "lastSeenAt": "2025-01-01T12:00:00.000Z",
        "createdAt": "2025-01-01T00:00:00.000Z"
      },
      "text": "Когда можно заехать?",
      "isRead": false,
      "sentAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-02T00:00:00.000Z",
      "readAt": "2025-01-03T00:00:00.000Z"
    }
  }
}
```

**Действия сервера**:
- Проверяет доступ пользователя к беседе.
- Создаёт сообщение.
- Рассылает события `message:new`, `conversation:preview:update` участникам (см. серверные события).

---

### message:read
Отметка сообщений как прочитанных.

**Запрос** (`WsMessageReadRequestDto`):
```typescript
{
  conversationId: number;
  messageIds?: number[];  // если не передан, считаются прочитанными все сообщения в беседе
}
```

**Успешный ответ**:
```json
{ "success": true }
```

**Действия сервера**:
- Помечает сообщения как прочитанные.
- Рассылает событие `message:read:update` в комнату беседы.
- Если прочитано последнее сообщение, обновляет превью беседы у отправителя и получателя.

---

### message:edit
Редактирование собственного сообщения.

**Запрос** (`WsMessageEditRequestDto`):
```typescript
{
  conversationId: number;
  messageId: number;
  newText: string;  // 1-1000 символов
}
```

**Успешный ответ** (с обновлённым сообщением):
```json
{
  "success": true,
  "data": {
    "message": {
      "id": 1,
      "sender": {
        "id": 1,
        "firstName": "Иван",
        "lastName": "Иванов",
        "patronymic": "Иванович",
        "rating": 4.8,
        "verified": true,
        "isOnline": true,
        "lastSeenAt": "2025-01-01T12:00:00.000Z",
        "createdAt": "2025-01-01T00:00:00.000Z"
      },
      "text": "Когда можно заехать?",
      "isRead": false,
      "sentAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-02T00:00:00.000Z",
      "readAt": "2025-01-03T00:00:00.000Z"
    }
  }
}
```

**Действия сервера**:
- Проверяет, что сообщение принадлежит пользователю.
- Обновляет текст.
- Рассылает событие `message:edited` в комнату беседы.
- Если редактируется последнее сообщение, обновляет превью беседы.

---

### message:delete
Удаление сообщений (только своих).

**Запрос** (`WsMessageDeleteRequestDto`):
```typescript
{
  conversationId: number;
  messageIds: number[]; // минимум 1 ID
}
```

**Успешный ответ**:
```json
{ "success": true }
```

**Действия сервера**:
- Проверяет владение сообщениями.
- Удаляет их.
- Рассылает событие `message:deleted` в комнату беседы.
- Если удалено последнее сообщение или были удалены непрочитанные, обновляет превью беседы.

---

### user:status:subscribe
Подписка на обновления статуса (online/offline) конкретного пользователя.

**Запрос** (`WsUserStatusSubscribeRequestDto`):
```typescript
{
  userId: number;
}
```

**Успешный ответ**:
```json
{ "success": true }
```

**Ошибки**: `UserNotFound` (если пользователь не существует).

---

### user:status:unsubscribe
Отписка от статуса пользователя.

**Запрос** (`WsUserStatusUnsubscribeRequestDto`):
```typescript
{
  userId: number;
}
```

**Успешный ответ**:
```json
{ "success": true }
```

## 6. События сервер → клиент

### message:new
Новое сообщение в беседе. Отправляется всем участникам беседы, находящимся в комнате `conversation:{id}`.

**Данные** (`WsMessageNewResponseDto`):
```typescript
{
  conversationId: number;
  message: {
    id: number,
    sender: {
      id: number,
      firstName: string,
      lastName: string,
      patronymic: string,
      rating: number,
      verified: boolean,
      isOnline: boolean,
      lastSeenAt: string,
      createdAt: string
    },
    text: string,
    isRead: boolean,
    sentAt: string,
    updatedAt: string,
    readAt: string
  }
}
```

---

### message:read:update
Обновление статуса прочтения сообщений. Отправляется в комнату беседы.

**Данные** (`WsMessageReadUpdateResponseDto`):
```typescript
{
  conversationId: number;
  userId: number;         // кто прочитал
  messageIds: number[];   // какие сообщения стали прочитанными
}
```

---

### message:edited
Сообщение отредактировано. Отправляется в комнату беседы.

**Данные** (`WsMessageEditedResponseDto`):
```typescript
{
  conversationId: number;
  message: {
    id: number,
    sender: {
      id: number,
      firstName: string,
      lastName: string,
      patronymic: string,
      rating: number,
      verified: boolean,
      isOnline: boolean,
      lastSeenAt: string,
      createdAt: string
    },
    text: string,
    isRead: boolean,
    sentAt: string,
    updatedAt: string,
    readAt: string
  }
}
```

---

### message:deleted
Сообщения удалены. Отправляется в комнату беседы.

**Данные** (`WsMessageDeletedResponseDto`):
```typescript
{
  conversationId: number;
  deletedMessageIds: number[];
}
```

---

### conversation:preview:update
Обновление превью беседы (последнее сообщение, счётчик непрочитанных). Отправляется в личную комнату пользователя (`user:{userId}`).

**Данные** (`WsConversationPreviewUpdateResponseDto`):
```typescript
{
  conversationId: number;
  unreadsCount: number;
  lastMessage: null | {
    id: number,
    sender: {
      id: number,
      firstName: string,
      lastName: string,
      patronymic: string,
      rating: number,
      verified: boolean,
      isOnline: boolean,
      lastSeenAt: string,
      createdAt: string
    },
    text: string,
    isRead: boolean,
    sentAt: string,
    updatedAt: string,
    readAt: string
  }
}
```

---

### user:status:update
Изменение статуса (online/offline) пользователя. Отправляется всем подписчикам через комнату `user:status:{userId}`.

**Данные** (`WsUserStatusUpdateResponseDto`):
```typescript
{
  userId: number;
  isOnline: boolean;
  lastSeenAt: string;  // ISO дата последней активности
}
```

---

### notification:new
Новое системное уведомление для пользователя (например, если он не в чате, но пришло сообщение). Отправляется в личную комнату пользователя.

**Данные** (`WsNotificationNewResponseDto`):
```typescript
{
  id: number;
  title: string;                    // парсится на сервере
  body: string;                     // парсится на сервере
  type: NotificationType;           // см. файл src\common\enums\notification-type.enum.ts
  referenceId?: number;             // ID связанной сущности (например, чата)
  payload?: AnyNotificationPayload; // см. файл src\common\interfaces\notification-payloads.interface.ts
  createdAt: string;
}
```

## 7. Примечания

- Идентификаторы (conversationId, userId, messageId) должны быть положительными целыми числами.
- Событие `error` может быть отправлено сервером при внутренних ошибках, не связанных с конкретным запросом (например, при падении соединения). Обрабатывайте его отдельно.
