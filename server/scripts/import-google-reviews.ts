/**
 * Copies each café's Google Maps reviews from the scrape into the
 * google_reviews collection - stars, text, language and date only (no names,
 * photos, profile links or owner replies). Replaces a café's reviews each run,
 * so it is safe to repeat. Run after `npm run seed`.
 *
 * Usage:
 *   npm run import:google-reviews
 *   npm run import:google-reviews -- --dry-run   # count, don't write
 */
import 'reflect-metadata';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { Cafe, CafeSchema } from '../src/cafes/schemas/cafe.schema';
import {
  GoogleReview,
  GoogleReviewSchema,
} from '../src/google-reviews/schemas/google-review.schema';
import { cafeIndexOf, loadRawCafes, type RawReview } from './raw-scrape';

type ImportedReview = Omit<GoogleReview, 'cafeId'>;

/**
 * The fields we keep from one scraped review, or null when it can't be shown
 * (no text, or stars outside 1-5). Nothing else from the scrape is copied.
 */
export function toGoogleReview(raw: RawReview): ImportedReview | null {
  const rating = Math.round(Number(raw.Rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;

  const text = (raw.text_original || raw.Description || '').trim();
  if (!text) return null;

  const language = raw.language?.trim() || null;
  const translated = raw.text_translated?.trim();
  const translatedText =
    language && language !== 'en' && translated && translated !== text
      ? translated
      : null;

  const date = raw.published_at ? new Date(raw.published_at) : null;
  const publishedAt = date && !Number.isNaN(date.getTime()) ? date : null;

  return { rating, text, translatedText, language, publishedAt };
}

export async function importGoogleReviews(
  uri: string,
  { dryRun = false } = {},
): Promise<number> {
  const raw = loadRawCafes();
  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    const CafeModel = connection.model(Cafe.name, CafeSchema);
    const ReviewModel = connection.model(GoogleReview.name, GoogleReviewSchema);
    if (!dryRun) await ReviewModel.syncIndexes();

    let imported = 0;
    for (const [i, source] of raw.entries()) {
      const index = cafeIndexOf(i);
      const cafe = await CafeModel.findOne({ index }, { _id: 1 }).lean();
      if (!cafe) {
        console.warn(
          `#${index} ${source.title}: no café with this index, skipped`,
        );
        continue;
      }
      const reviews = (source.user_reviews ?? [])
        .map(toGoogleReview)
        .filter((r): r is ImportedReview => r !== null);
      if (!dryRun) {
        await ReviewModel.deleteMany({ cafeId: cafe._id });
        if (reviews.length) {
          await ReviewModel.insertMany(
            reviews.map((r) => ({ ...r, cafeId: cafe._id })),
          );
        }
      }
      imported += reviews.length;
    }
    console.log(
      `${dryRun ? '[dry run] ' : ''}Imported ${imported} Google reviews for ${raw.length} cafés`,
    );
    return imported;
  } finally {
    await connection.close();
  }
}

if (require.main === module) {
  try {
    process.loadEnvFile(join(__dirname, '..', '.env'));
  } catch {
    // No .env file - fall back to the real environment.
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set (copy .env.example to .env)');
    process.exit(1);
  }
  importGoogleReviews(uri, {
    dryRun: process.argv.includes('--dry-run'),
  }).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
