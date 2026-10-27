import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/**
 * A Google Maps review imported from the scrape (npm run import:google-reviews).
 * Deliberately anonymous: no reviewer name, photo or profile link, and no
 * owner reply - only the stars, the text and when it was posted.
 */
@Schema({ collection: 'google_reviews' })
export class GoogleReview {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Cafe', required: true })
  cafeId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  /** As the reviewer wrote it. */
  @Prop({ type: String, required: true })
  text: string;

  /** Google's English translation, kept only when the original isn't English. */
  @Prop({ type: String, default: null })
  translatedText: string | null;

  /** Language of `text`, e.g. "en" or "th"; null when Google didn't say. */
  @Prop({ type: String, default: null })
  language: string | null;

  @Prop({ type: Date, default: null })
  publishedAt: Date | null;
}

export type GoogleReviewDocument = HydratedDocument<GoogleReview>;

export const GoogleReviewSchema = SchemaFactory.createForClass(GoogleReview);
// A café's reviews, newest first.
GoogleReviewSchema.index({ cafeId: 1, publishedAt: -1 });
