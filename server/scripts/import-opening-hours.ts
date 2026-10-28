/**
 * Copies each café's weekly opening hours from the Google Maps scrape into
 * cafes.openingHours. A café whose hours can't be read is left without them
 * (the site then shows no open/closed status) rather than guessed. Safe to
 * repeat. Run after `npm run seed`.
 *
 * Usage:
 *   npm run import:opening-hours
 *   npm run import:opening-hours -- --dry-run   # count, don't write
 */
import 'reflect-metadata';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { parseWeeklyHours } from '../src/cafes/opening-hours';
import { Cafe, CafeSchema } from '../src/cafes/schemas/cafe.schema';
import { cafeIndexOf, loadRawCafes } from './raw-scrape';

export async function importOpeningHours(
  uri: string,
  { dryRun = false } = {},
): Promise<{ imported: number; unreadable: number }> {
  const raw = loadRawCafes();
  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    const CafeModel = connection.model(Cafe.name, CafeSchema);
    let imported = 0;
    let unreadable = 0;
    for (const [i, source] of raw.entries()) {
      const index = cafeIndexOf(i);
      const periods = parseWeeklyHours(source.open_hours);
      if (!periods) {
        console.warn(`#${index} ${source.title}: hours unreadable, left out`);
        unreadable++;
      }
      if (dryRun) {
        if (periods) imported++;
        continue;
      }
      const result = await CafeModel.updateOne(
        { index },
        periods
          ? { $set: { openingHours: periods } }
          : { $unset: { openingHours: 1 } },
      );
      if (!result.matchedCount) {
        console.warn(
          `#${index} ${source.title}: no café with this index, skipped`,
        );
      } else if (periods) {
        imported++;
      }
    }
    console.log(
      `${dryRun ? '[dry run] ' : ''}Opening hours for ${imported} of ${raw.length} cafés (${unreadable} unreadable)`,
    );
    return { imported, unreadable };
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
  importOpeningHours(uri, {
    dryRun: process.argv.includes('--dry-run'),
  }).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
