import type { OpeningPeriod } from '../opening-hours';
import type { Cafe, DrinkType } from '../schemas/cafe.schema';

/** Public café shape - mirrors `Cafe` in web/lib/cafes.ts, plus optional distance. */
export class CafeResponseDto {
  slug: string;
  index: string;
  name: string;
  area: string;
  address: string;
  specialty: string;
  flavor: string;
  atmosphere: string;
  priceAvg: number;
  tags: string[];
  hours: string;
  /** Opening periods for the week (Chiang Mai time), or null if unknown. */
  openingHours: OpeningPeriod[] | null;
  rating: number;
  reviewCount: number;
  petFriendly: boolean;
  parking: boolean;
  drinkType: DrinkType;
  lat: number;
  lng: number;
  /** BrewMap reviews average, null until the first review. Separate from Google's `rating`. */
  communityRating: number | null;
  communityReviewCount: number;
  /** AI summary of Google reviews, or null if not generated yet. */
  aiSummary: { pros: string[]; cons: string[] } | null;
  /** Present only when the request included lat/lng. */
  distanceKm?: number;
}

export class PaginatedCafesDto {
  items: CafeResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class CafeFiltersDto {
  areas: string[];
  tags: string[];
  drinkTypes: DrinkType[];
  priceRange: { min: number; max: number };
}

export function toCafeResponse(
  cafe: Cafe & { distanceMeters?: number },
): CafeResponseDto {
  const [lng, lat] = cafe.location.coordinates;
  const response: CafeResponseDto = {
    slug: cafe.slug,
    index: cafe.index,
    name: cafe.name,
    area: cafe.area,
    address: cafe.address,
    specialty: cafe.specialty,
    flavor: cafe.flavor,
    atmosphere: cafe.atmosphere,
    priceAvg: cafe.priceAvg,
    tags: cafe.tags,
    hours: cafe.hours,
    openingHours: cafe.openingHours
      ? cafe.openingHours.map(({ day, open, close }) => ({ day, open, close }))
      : null,
    rating: cafe.rating,
    reviewCount: cafe.reviewCount,
    petFriendly: cafe.petFriendly,
    parking: cafe.parking,
    drinkType: cafe.drinkType,
    lat,
    lng,
    // Documents seeded before Phase 4 don't have these yet.
    communityRating: cafe.communityRating ?? null,
    communityReviewCount: cafe.communityReviewCount ?? 0,
    aiSummary: cafe.aiSummary
      ? { pros: cafe.aiSummary.pros, cons: cafe.aiSummary.cons }
      : null,
  };
  if (cafe.distanceMeters !== undefined) {
    response.distanceKm = Math.round(cafe.distanceMeters / 100) / 10;
  }
  return response;
}
