import { Transform } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { CafeResponseDto } from '../../cafes/dto/cafe-response.dto';
import type { CafeSort } from '../../cafes/dto/query-cafes.dto';
import type { DrinkType } from '../../cafes/schemas/cafe.schema';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class AiFindDto {
  /** What the visitor wants, in Thai or English. */
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  query: string;

  /** Optional visitor location; both or neither. */
  @ValidateIf((o: AiFindDto) => o.lat !== undefined || o.lng !== undefined)
  @IsLatitude()
  lat?: number;

  @ValidateIf((o: AiFindDto) => o.lat !== undefined || o.lng !== undefined)
  @IsLongitude()
  lng?: number;
}

/** The filters actually applied after validating what Gemini proposed. */
export interface AppliedFilters {
  /** Café name words, when the request names a specific café. */
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  drinkType?: DrinkType;
  parking?: boolean;
  petFriendly?: boolean;
  tag?: string;
  area?: string;
  radiusKm?: number;
  sort?: CafeSort;
}

export class AiMatchDto {
  cafe: CafeResponseDto;
  /** Why it fits, written only from the café data; null if Gemini couldn't explain. */
  reason: string | null;
}

export class AiFindResponseDto {
  /** The filters the results actually match. */
  filters: AppliedFilters;
  /** Filters dropped because nothing matched them all; {} for an exact match. */
  relaxed: AppliedFilters;
  items: AiMatchDto[];
}
