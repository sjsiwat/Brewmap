import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { Review } from '../schemas/review.schema';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  text: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  drinkOrdered?: string;
}

/** Any subset of the fields. `drinkOrdered: ""` clears it. */
export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  text?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  drinkOrdered?: string;
}

export class QueryReviewsDto {
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
  limit: number = 10;
}

export class ReviewResponseDto {
  id: string;
  rating: number;
  text: string;
  drinkOrdered?: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; displayName: string };
}

export class PaginatedReviewsDto {
  items: ReviewResponseDto[];
  total: number;
  page: number;
  limit: number;
  /** Fresh café totals, so a cached café page can still show the current numbers. */
  communityRating: number | null;
  communityReviewCount: number;
}

/** The logged-in user's review of a café, or null if they haven't written one. */
export class MyReviewDto {
  review: ReviewResponseDto | null;
}

// Shown when the author's account no longer exists.
const FORMER_MEMBER = 'Former member';

export function toReviewResponse(
  review: Review & { _id: { toString(): string } },
  displayName: string | undefined,
): ReviewResponseDto {
  const response: ReviewResponseDto = {
    id: review._id.toString(),
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    author: {
      id: review.userId.toString(),
      displayName: displayName ?? FORMER_MEMBER,
    },
  };
  if (review.drinkOrdered) response.drinkOrdered = review.drinkOrdered;
  return response;
}
