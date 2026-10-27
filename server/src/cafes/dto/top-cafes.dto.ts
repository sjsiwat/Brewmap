import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { emptyToUndefined } from './query-cafes.dto';

export class TopCafesDto {
  /** Restrict the ranking to one tag, e.g. "Matcha" for "Top 10 Matcha". */
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  tag?: string;

  /** Ignore cafés with too few Google reviews so a 5.0 from 3 people doesn't top the list. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minReviews: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
