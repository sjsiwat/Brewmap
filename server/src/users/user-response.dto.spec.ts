import { model } from 'mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { toUserResponse } from './user-response.dto';

// Built in memory only - nothing is saved, so no database is needed.
const UserModel = model(User.name, UserSchema);

describe('toUserResponse', () => {
  it('returns public fields only and never the password hash', () => {
    const user = new UserModel({
      email: '  Siwat@Example.COM ',
      passwordHash: '$2b$10$secret',
      displayName: 'Siwat',
    });
    const res = toUserResponse(user);
    expect(res).toEqual({
      id: user.id as string,
      email: 'siwat@example.com',
      displayName: 'Siwat',
      role: 'user',
    });
    expect(JSON.stringify(res)).not.toContain('secret');
  });
});
