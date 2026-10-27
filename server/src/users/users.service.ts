import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  create(user: Pick<User, 'email' | 'passwordHash' | 'displayName'>) {
    return this.userModel.create(user);
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.trim().toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    // A token from another database (or a tampered one) can carry a non-ObjectId id.
    if (!/^[0-9a-f]{24}$/i.test(id)) return null;
    return this.userModel.findById(id);
  }
}
