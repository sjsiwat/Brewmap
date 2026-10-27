import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  /** Display names by user id, for showing who wrote something. */
  async displayNames(ids: Types.ObjectId[]): Promise<Map<string, string>> {
    const users = await this.userModel
      .find({ _id: { $in: ids } }, { displayName: 1 })
      .lean<{ _id: Types.ObjectId; displayName: string }[]>();
    return new Map(users.map((u) => [u._id.toString(), u.displayName]));
  }

  /** The user's current token version, or null when the account is gone. */
  async tokenVersion(id: string): Promise<number | null> {
    if (!/^[0-9a-f]{24}$/i.test(id)) return null;
    const user = await this.userModel
      .findById(id, { tokenVersion: 1 })
      .lean<{ tokenVersion?: number }>();
    return user ? (user.tokenVersion ?? 0) : null;
  }

  /** Revokes tokens carrying `version`; a no-op if they were already revoked. */
  async revokeTokens(id: string, version: number): Promise<void> {
    if (!/^[0-9a-f]{24}$/i.test(id)) return;
    await this.userModel.updateOne(
      { _id: id, tokenVersion: version === 0 ? { $in: [0, null] } : version },
      { $inc: { tokenVersion: 1 } },
    );
  }

  async findById(id: string): Promise<UserDocument | null> {
    // A token from another database (or a tampered one) can carry a non-ObjectId id.
    if (!/^[0-9a-f]{24}$/i.test(id)) return null;
    return this.userModel.findById(id);
  }
}
