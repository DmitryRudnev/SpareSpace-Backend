export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}

export class ConversationNotFoundException extends DomainException {
  constructor(conversationId: number) {
    super(`Conversation with id ${conversationId} not found`);
    this.name = 'ConversationNotFoundException';
  }
}

export class ConversationAccessDeniedException extends DomainException {
  constructor(conversationId: number, userId: number) {
    super(`User ${userId} does not have access to conversation ${conversationId}`);
    this.name = 'ConversationAccessDeniedException';
  }
}

export class MessageNotFoundException extends DomainException {
  constructor(messageId: number) {
    super(`Message with id ${messageId} not found`);
    this.name = 'MessageNotFoundException';
  }
}
