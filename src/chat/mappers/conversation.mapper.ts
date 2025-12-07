import { Conversation } from '../../entities/conversation.entity';
import { UserMapper } from '../../users/mappers/user.mapper';
import { ListingMapper } from '../../listings/mappers/listing.mapper';
import {
  ConversationResponseDto,
  ConversationsListResponseDto,
} from '../dto/responses';

export class ConversationMapper {
  static toResponseDto(conversation: Conversation): ConversationResponseDto {
    const dto = new ConversationResponseDto();
    
    dto.id = conversation.id;
    dto.participant1 = UserMapper.toPublicResponseDto(conversation.participant1);
    dto.participant2 = UserMapper.toPublicResponseDto(conversation.participant2);
    dto.listing = conversation.listing ? ListingMapper.toResponseDto(conversation.listing) : null;
    dto.lastMessageAt = conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toISOString() : null;
    dto.createdAt = new Date(conversation.createdAt).toISOString();
    dto.updatedAt = new Date(conversation.updatedAt).toISOString();
    return dto;
  }

  static toListResponseDto(
    conversations: Conversation[], 
    total: number, 
    limit: number, 
    offset: number
  ): ConversationsListResponseDto {
    const dto = new ConversationsListResponseDto();
    
    dto.conversations = conversations.map(conversation => this.toResponseDto(conversation));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;
    return dto;
  }
}
