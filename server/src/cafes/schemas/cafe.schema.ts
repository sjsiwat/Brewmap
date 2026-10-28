import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import type { OpeningPeriod } from '../opening-hours';

export const DRINK_TYPES = ['Coffee', 'Tea', 'Non-Coffee'] as const;
export type DrinkType = (typeof DRINK_TYPES)[number];

/** Pros/cons distilled from Google reviews by scripts/summarize-reviews.ts. */
export interface AiSummary {
  pros: string[];
  cons: string[];
  model: string;
  generatedAt: Date;
}

const AiSummarySchema = new MongooseSchema<AiSummary>(
  {
    pros: { type: [String], default: [] },
    cons: { type: [String], default: [] },
    model: { type: String, required: true },
    generatedAt: { type: Date, required: true },
  },
  { _id: false },
);

/**
 * The café's descriptive text in Thai, made from the English by
 * scripts/translate-cafes.ts. Name, address, tags and area stay as they are.
 */
export interface CafeTranslation {
  specialty: string;
  flavor: string;
  atmosphere: string;
  /** The AI review summary in Thai, or null when the café has none. */
  aiSummary: { pros: string[]; cons: string[] } | null;
  model: string;
  generatedAt: Date;
}

const CafeTranslationSchema = new MongooseSchema<CafeTranslation>(
  {
    specialty: { type: String, required: true },
    flavor: { type: String, required: true },
    atmosphere: { type: String, required: true },
    aiSummary: {
      type: new MongooseSchema(
        { pros: [String], cons: [String] },
        { _id: false },
      ),
      default: null,
    },
    model: { type: String, required: true },
    generatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const OpeningPeriodSchema = new MongooseSchema<OpeningPeriod>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: Number, required: true, min: 0 },
    close: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

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

  /** Display summary of one day, e.g. "08:00–18:00"; see openingHours for the real week. */
  @Prop({ type: String, required: true })
  hours: string;

  /**
   * Every day's opening periods from Google Maps (scripts/import-opening-hours.ts).
   * Absent until imported; [] would mean closed all week.
   */
  @Prop({ type: [OpeningPeriodSchema], default: undefined })
  openingHours?: OpeningPeriod[];

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

  /** Generated once offline, never per page view. Absent until the script runs. */
  @Prop({ type: AiSummarySchema, required: false })
  aiSummary?: AiSummary;

  /** Thai text for the API's `lang=th`. Absent until scripts/translate-cafes.ts runs. */
  @Prop({ type: CafeTranslationSchema, required: false })
  th?: CafeTranslation;
}

export type CafeDocument = HydratedDocument<Cafe>;

export const CafeSchema = SchemaFactory.createForClass(Cafe);
CafeSchema.index({ location: '2dsphere' });
CafeSchema.index({ rating: -1, reviewCount: -1 });
