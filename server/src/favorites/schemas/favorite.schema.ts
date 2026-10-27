import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

@Schema({
  collection: 'favorites',
  timestamps: { createdAt: true, updatedAt: false },
})
export class Favorite {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Cafe', required: true })
  cafeId: Types.ObjectId;

  createdAt: Date;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
// One row per (user, café); also serves "my favorites, newest first".
FavoriteSchema.index({ userId: 1, cafeId: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, createdAt: -1 });
