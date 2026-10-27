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
  rating: number;
  reviewCount: number;
  petFriendly: boolean;
  parking: boolean;
  drinkType: DrinkType;
  lat: number;
  lng: number;
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
    rating: cafe.rating,
    reviewCount: cafe.reviewCount,
    petFriendly: cafe.petFriendly,
    parking: cafe.parking,
    drinkType: cafe.drinkType,
    lat,
    lng,
  };
  if (cafe.distanceMeters !== undefined) {
    response.distanceKm = Math.round(cafe.distanceMeters / 100) / 10;
  }
  return response;
}
