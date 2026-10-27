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

// Query strings are always text, and Boolean("false") === true, so parse explicitly.
const toBoolean = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

export class QueryCafesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
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
  @IsLatitude()
  lat?: number;

  @ValidateIf((o: QueryCafesDto) => o.lat !== undefined || o.lng !== undefined)
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  /** Only return cafés within this radius of (lat, lng). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm?: number;

  /** Defaults to `distance` when lat/lng are given, otherwise `rating`. */
  @IsOptional()
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
