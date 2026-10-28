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
  /** Average of BrewMap reviews (1 decimal), null until the first. Separate from Google's `rating`. */
  communityRating: number | null;
  communityReviewCount: number;
  /** Pros/cons distilled from Google reviews by AI (generated offline), null until then. */
  aiSummary: { pros: string[]; cons: string[] } | null;
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
