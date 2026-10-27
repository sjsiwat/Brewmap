import type { CafeQuery } from "@/lib/api";

export type DrinkType = "Coffee" | "Tea" | "Non-Coffee";

/** Mirrors CafeResponseDto in server/src/cafes/dto/cafe-response.dto.ts. */
export interface Cafe {
  slug: string;
  index: string;
  name: string;
  area: string;
  address: string;
  specialty: string;
  /** Free-text tasting description, for display only. */
  flavor: string;
  atmosphere: string;
  /** Typical drink price in THB. */
  priceAvg: number;
  tags: string[];
  hours: string;
  rating: number;
  reviewCount: number;
  petFriendly: boolean;
  parking: boolean;
  drinkType: DrinkType;
  lat: number;
  lng: number;
}

export function formatPrice(priceAvg: number): string {
  return `~${priceAvg}฿`;
}

export function osmEmbedUrl(lat: number, lng: number, delta = 0.006): string {
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function osmViewUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

/** One choice in a finder dropdown; `query` is what it adds to the API request. */
export interface FilterOption {
  label: string;
  query?: CafeQuery;
}

// priceAvg is a whole number of baht, so "under 100" is maxPrice 99.
export const priceOptions: FilterOption[] = [
  { label: "Any" },
  { label: "Under 100฿", query: { maxPrice: 99 } },
  { label: "100–140฿", query: { minPrice: 100, maxPrice: 140 } },
  { label: "Over 140฿", query: { minPrice: 141 } },
];

export const distanceOptions: FilterOption[] = [
  { label: "Any" },
  { label: "Within 1 km", query: { radiusKm: 1 } },
  { label: "Within 3 km", query: { radiusKm: 3 } },
  { label: "Within 8 km", query: { radiusKm: 8 } },
];

export const parkingOptions: FilterOption[] = [
  { label: "Any" },
  { label: "Parking required", query: { parking: true } },
];

export const drinkTypeOptions: FilterOption[] = [
  { label: "Any" },
  { label: "Coffee", query: { drinkType: "Coffee" } },
  { label: "Tea", query: { drinkType: "Tea" } },
  { label: "Non-Coffee", query: { drinkType: "Non-Coffee" } },
];
