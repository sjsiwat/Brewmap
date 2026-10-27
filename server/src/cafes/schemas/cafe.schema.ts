import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export const DRINK_TYPES = ['Coffee', 'Tea', 'Non-Coffee'] as const;
export type DrinkType = (typeof DRINK_TYPES)[number];

/** GeoJSON point. Note MongoDB's order is [lng, lat]. */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

const GeoPointSchema = new MongooseSchema<GeoPoint>(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

// Every @Prop declares `type` explicitly so the schema also works when loaded
// outside the Nest compiler (e.g. scripts/seed.ts via tsx, which doesn't emit
// decorator metadata).
@Schema({ collection: 'cafes', timestamps: true })
export class Cafe {
  @Prop({ type: String, required: true, unique: true })
  slug: string;

  /** Display order from the source dataset ("001"…"173"). */
  @Prop({ type: String, required: true })
  index: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, index: true })
  area: string;

  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: String, required: true })
  specialty: string;

  /** Free-text tasting description, for display only. */
  @Prop({ type: String, required: true })
  flavor: string;

  @Prop({ type: String, required: true })
  atmosphere: string;

  /** Typical drink price in THB. */
  @Prop({ type: Number, required: true, min: 0 })
  priceAvg: number;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ type: String, required: true })
  hours: string;

  @Prop({ type: Number, required: true, min: 0, max: 5 })
  rating: number;

  @Prop({ type: Number, required: true, min: 0 })
  reviewCount: number;

  @Prop({ type: Boolean, default: false })
  petFriendly: boolean;

  @Prop({ type: Boolean, default: false })
  parking: boolean;

  @Prop({ type: String, enum: DRINK_TYPES, required: true })
  drinkType: DrinkType;

  @Prop({ type: GeoPointSchema, required: true })
  location: GeoPoint;

  /** Average of BrewMap reviews (1 decimal), null until the first one. Separate from Google's `rating`. */
  @Prop({ type: Number, default: null, min: 1, max: 5 })
  communityRating: number | null;

  @Prop({ type: Number, default: 0, min: 0 })
  communityReviewCount: number;
}

export type CafeDocument = HydratedDocument<Cafe>;

export const CafeSchema = SchemaFactory.createForClass(Cafe);
CafeSchema.index({ location: '2dsphere' });
CafeSchema.index({ rating: -1, reviewCount: -1 });
