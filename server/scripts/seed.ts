/**
 * Upserts web/data/cafes.json into MongoDB (keyed by slug) and syncs indexes.
 * Safe to run repeatedly. Usage: npm run seed
 */
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { Cafe, CafeSchema } from '../src/cafes/schemas/cafe.schema';

type SourceCafe = Omit<Cafe, 'location'> & { lat: number; lng: number };

const DATA_PATH = join(__dirname, '..', '..', 'web', 'data', 'cafes.json');

export function toCafeDocument({ lat, lng, ...rest }: SourceCafe): Cafe {
  return { ...rest, location: { type: 'Point', coordinates: [lng, lat] } };
}

export async function seedCafes(uri: string): Promise<number> {
  const source = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as SourceCafe[];
  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    const CafeModel = connection.model(Cafe.name, CafeSchema);
    await CafeModel.syncIndexes();
    const result = await CafeModel.bulkWrite(
      source.map((cafe) => ({
        // $set (not replace) so fields added later, e.g. aiSummary, survive a re-seed.
        updateOne: {
          filter: { slug: cafe.slug },
          update: { $set: toCafeDocument(cafe) },
          upsert: true,
        },
      })),
    );
    console.log(
      `Seeded ${source.length} cafés (${result.upsertedCount} new, ${result.modifiedCount} updated)`,
    );
    return source.length;
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
  seedCafes(uri).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
