/**
 * The Google Maps scrape that web/data/cafes.json was built from. Reviewer
 * names, photos, profile links and owner replies were stripped from it
 * (Phase 4c), so only what's typed below is left in each review.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const RAW_PATH = join(
  __dirname,
  '..',
  '..',
  'web',
  'scripts',
  'scrape-cafes',
  'raw-full173.json',
);

export interface RawReview {
  /** Stars as a number or a numeric string, e.g. 4 or "4". */
  Rating?: number | string;
  Description?: string;
  text_original?: string;
  text_translated?: string;
  /** Language of the original text, e.g. "en", "th". */
  language?: string;
  /** ISO date, e.g. "2026-08-24T09:14:26.402814Z". */
  published_at?: string;
}

export interface RawCafe {
  title: string;
  /** Per weekday, e.g. { Monday: ["8 AM–6 PM"], Tuesday: ["Closed"] }. */
  open_hours?: Record<string, string[]> | null;
  user_reviews?: RawReview[] | null;
}

export function loadRawCafes(): RawCafe[] {
  return JSON.parse(readFileSync(RAW_PATH, 'utf8')) as RawCafe[];
}

/** cafes.json was built from the scrape in order: entry i is café index "00{i+1}". */
export function cafeIndexOf(position: number): string {
  return String(position + 1).padStart(3, '0');
}
