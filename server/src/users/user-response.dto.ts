import type { UserDocument, UserRole } from './schemas/user.schema';

/** Public user shape. Built field by field so `passwordHash` can never leak. */
export class UserResponseDto {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export function toUserResponse(user: UserDocument): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}
