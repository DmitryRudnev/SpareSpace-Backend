import { User } from '../../entities/user.entity';
import { UserPublicResponseDto } from '../dto/responses/user-public-response.dto';
import { UserPrivateResponseDto } from '../dto/responses/user-private-response.dto';

export class UserMapper {
  static toPublicResponse(user: User): UserPublicResponseDto {
    const dto = new UserPublicResponseDto();
    
    dto.id = user.id;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.patronymic = user.patronymic;
    dto.rating = user.rating;
    dto.verified = user.verified;
    dto.createdAt = user.createdAt;

    return dto;
  }

  static toPrivateResponse(user: User): UserPrivateResponseDto {
    const baseDto = this.toPublicResponse(user);
    const dto = new UserPrivateResponseDto();
    
    Object.assign(dto, baseDto);
    
    dto.email = user.email;
    dto.phone = user.phone;
    dto.twoFaEnabled = user.twoFaEnabled;

    return dto;
  }
}
