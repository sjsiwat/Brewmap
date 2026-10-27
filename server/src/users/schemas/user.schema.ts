import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const USER_ROLES = ['user', 'owner', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  /** bcrypt hash. Never returned by the API - see toUserResponse(). */
  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: String, required: true, trim: true })
  displayName: string;

  @Prop({ type: String, enum: USER_ROLES, default: 'user' })
  role: UserRole;

  /**
   * Copied into each JWT as `ver`. Logging out bumps it, which revokes every
   * token issued before - a stolen or copied cookie stops working too.
   */
  @Prop({ type: Number, default: 0 })
  tokenVersion: number;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
