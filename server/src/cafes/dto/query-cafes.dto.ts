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
const emptyToUndefined = ({ value, obj, key }: TransformArgs) =>
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

export class QueryCafesDto {
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
  @IsString()
  tag?: string;

  @IsOptional()
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
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
