import { Message } from '../../entities/message.entity';
import { MessageResponseDto } from '../dto/responses/message-response.dto';
import { MessageListResponseDto } from '../dto/responses/message-list-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';

export class MessageMapper {
  static toResponseDto(message: Message): MessageResponseDto {
    const dto = new MessageResponseDto();
    
    dto.id = message.id;
    dto.sender = UserMapper.toPublicResponseDto(message.sender);
    dto.text = message.text;
    dto.isRead = message.isRead;
    dto.sentAt = new Date(message.sentAt).toISOString();
    dto.updatedAt = new Date(message.updatedAt).toISOString();
    dto.readAt = message.readAt ? new Date(message.readAt).toISOString() : null;
    return dto;
  }

  static toListResponseDto(
    messages: Message[], 
    total: number, 
    limit: number, 
    offset: number
  ): MessageListResponseDto {
    const dto = new MessageListResponseDto();
    
    dto.messages = messages.map(message => this.toResponseDto(message));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;
    return dto;
  }
}
