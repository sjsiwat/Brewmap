import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { LANGS, type Lang } from '../lang';
import { emptyToUndefined } from './query-cafes.dto';

export class LangQueryDto {
  /** `th`: specialty, flavor, atmosphere and AI summary in Thai where translated. Default `en`. */
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(LANGS)
  lang?: Lang;
}
