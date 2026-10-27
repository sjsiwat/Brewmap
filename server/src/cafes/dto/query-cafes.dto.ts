import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { DRINK_TYPES, type DrinkType } from '../schemas/cafe.schema';

export const CAFE_SORTS = ['rating', 'distance', 'reviews', 'price'] as const;
export type CafeSort = (typeof CAFE_SORTS)[number];

type TransformArgs = {
  value: unknown;
  obj: Record<string, unknown>;
  key: string;
};

// An empty query param (`?maxPrice=`) means "not set". Without this, @Type(() => Number)
// turns "" into 0, which then passes validation (e.g. lat=0 / lng=0). Not used on
// page/limit: undefined would override their defaults, so "" there stays a 400.
export const emptyToUndefined = ({ value, obj, key }: TransformArgs) =>
  obj[key] === '' ? undefined : value;

// Query strings are always text, and Boolean("false") === true, so parse explicitly.
const toBoolean = ({ value }: TransformArgs) =>
  value === 'true'
    ? true
    : value === 'false'
      ? false
      : value === ''
        ? undefined
        : value;

// Trimmed, inner whitespace collapsed; blank means "not set".
const normaliseSearch = ({ value }: TransformArgs) => {
  if (typeof value !== 'string') return value;
  const text = value.trim().replace(/\s+/g, ' ');
  return text === '' ? undefined : text;
};

export const SEARCH_MAX = 60;

/**
 * The words of a name search: letters (any script, with Thai vowel and tone
 * marks), digits. Punctuation is ignored, so "%arabica" finds "% Arabica".
 */
export function searchWords(q: string): string[] {
  return q
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 6);
}

export class QueryCafesDto {
  /** Café name search: every word must appear in the name, any case. */
  @IsOptional()
  @Transform(normaliseSearch)
  @IsString()
  @MaxLength(SEARCH_MAX)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @Transform(emptyToUndefined)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @Transform(emptyToUndefined)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(DRINK_TYPES)
  drinkType?: DrinkType;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  parking?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  petFriendly?: boolean;

  /** Exact tag match, e.g. "Matcha", "Quiet". */
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  tag?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  area?: string;

  /** User latitude. Required together with `lng`; enables `distanceKm` in results. */
  @ValidateIf((o: QueryCafesDto) => o.lng !== undefined || o.lat !== undefined)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  @IsLatitude()
  lat?: number;

  @ValidateIf((o: QueryCafesDto) => o.lat !== undefined || o.lng !== undefined)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  @IsLongitude()
  lng?: number;

  /** Only return cafés within this radius of (lat, lng). */
  @IsOptional()
  @Type(() => Number)
  @Transform(emptyToUndefined)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm?: number;

  /** Defaults to `distance` when lat/lng are given, otherwise `rating`. */
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(CAFE_SORTS)
  sort?: CafeSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  // Far beyond any real list; stops huge values overflowing the skip (500).
  @Max(10_000)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
