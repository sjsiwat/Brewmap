import type { AiFilters } from "@/lib/api";
import type { DrinkType } from "@/lib/cafes";
import { DEFAULT_ORIGIN, type LatLng } from "@/lib/geo";

/**
 * Everything that narrows the café list. The filter chips and the AI finder
 * both write to this one object, so whatever the AI understood can be seen
 * and undone chip by chip.
 */
export interface FinderFilters {
  /** Café name the AI picked out of a sentence ("% Arabica"). */
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  radiusKm?: number;
  parking?: boolean;
  petFriendly?: boolean;
  drinkType?: DrinkType;
  tag?: string;
  area?: string;
  openNow?: boolean;
}

export type FilterKey = keyof FinderFilters;

export interface PriceRange {
  minPrice?: number;
  maxPrice?: number;
}

// priceAvg is a whole number of baht, so "under 100" is maxPrice 99.
export const pricePresets: Array<PriceRange & { label: string }> = [
  { label: "Under 100฿", maxPrice: 99 },
  { label: "100–140฿", minPrice: 100, maxPrice: 140 },
  { label: "Over 140฿", minPrice: 141 },
];

export const distancePresets = [1, 3, 8];

export const drinkTypes: DrinkType[] = ["Coffee", "Tea", "Non-Coffee"];

export function priceKey({ minPrice, maxPrice }: PriceRange): string {
  return `${minPrice ?? ""}-${maxPrice ?? ""}`;
}

export function parsePriceKey(key: string): PriceRange {
  const [min, max] = key.split("-");
  return {
    ...(min !== "" && { minPrice: Number(min) }),
    ...(max !== "" && { maxPrice: Number(max) }),
  };
}

/** Preset name when it is one, otherwise the range the AI chose, e.g. "Up to 150฿". */
export function priceLabel(range: PriceRange): string | null {
  const { minPrice, maxPrice } = range;
  if (minPrice === undefined && maxPrice === undefined) return null;
  const preset = pricePresets.find((p) => priceKey(p) === priceKey(range));
  if (preset) return preset.label;
  if (minPrice !== undefined && maxPrice !== undefined) return `${minPrice}–${maxPrice}฿`;
  if (maxPrice !== undefined) return `Up to ${maxPrice}฿`;
  return `${minPrice}฿ and up`;
}

export function distanceLabel(km: number): string {
  return `Within ${km} km`;
}

export function activeFilterCount(filters: FinderFilters): number {
  const { minPrice, maxPrice, ...rest } = filters;
  const price = minPrice !== undefined || maxPrice !== undefined ? 1 : 0;
  return price + Object.values(rest).filter((value) => value !== undefined).length;
}

/** The AI's filters, keeping only what the chips can show and remove. */
export function fromAiFilters(ai: AiFilters): FinderFilters {
  const { q, minPrice, maxPrice, radiusKm, parking, petFriendly, drinkType, tag, area } = ai;
  const filters: FinderFilters = { q, minPrice, maxPrice, radiusKm, drinkType, tag, area };
  // A false here means "doesn't matter" to the chips, not "must not have".
  if (parking) filters.parking = true;
  if (petFriendly) filters.petFriendly = true;
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined),
  ) as FinderFilters;
}

/** Where distances are measured from. */
export type ReferencePlace = "device" | "nimman" | "oldCity";

export const referencePlaces: Record<Exclude<ReferencePlace, "device">, { label: string; at: LatLng }> = {
  // Nimmanhaemin Rd around Soi 9, between One Nimman and Maya.
  nimman: { label: "Nimman", at: { lat: 18.7983, lng: 98.9676 } },
  oldCity: { label: "Old City", at: DEFAULT_ORIGIN },
};

/** `filters` with `patch` applied; an undefined value removes that filter. */
export function patchFilters(filters: FinderFilters, patch: Partial<FinderFilters>): FinderFilters {
  const next = { ...filters, ...patch };
  (Object.keys(next) as FilterKey[]).forEach((key) => next[key] === undefined && delete next[key]);
  return next;
}

/** Short labels for a set of filters, e.g. for "the AI skipped: …". */
export function filterLabels(filters: FinderFilters): string[] {
  const labels: string[] = [];
  if (filters.q) labels.push(`“${filters.q}”`);
  const price = priceLabel(filters);
  if (price) labels.push(price);
  if (filters.radiusKm) labels.push(distanceLabel(filters.radiusKm));
  if (filters.openNow) labels.push("Open now");
  if (filters.parking) labels.push("Parking");
  if (filters.petFriendly) labels.push("Pet friendly");
  if (filters.drinkType) labels.push(filters.drinkType);
  if (filters.tag) labels.push(filters.tag);
  if (filters.area) labels.push(filters.area);
  return labels;
}
