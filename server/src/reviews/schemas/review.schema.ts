import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ collection: 'reviews', timestamps: true })
export class Review {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Cafe', required: true })
  cafeId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000,
  })
  text: string;

  /** What the reviewer had, e.g. "Iced dirty". */
  @Prop({ type: String, trim: true, maxlength: 100 })
  drinkOrdered?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ReviewDocument = HydratedDocument<Review>;

export const ReviewSchema = SchemaFactory.createForClass(Review);
// One review per user per café; also lists a café's reviews newest first.
ReviewSchema.index({ userId: 1, cafeId: 1 }, { unique: true });
ReviewSchema.index({ cafeId: 1, createdAt: -1 });
