import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CafesService } from './cafes.service';
import {
  CafeFiltersDto,
  CafeResponseDto,
  PaginatedCafesDto,
} from './dto/cafe-response.dto';
import { LangQueryDto } from './dto/lang.dto';
import { QueryCafesDto } from './dto/query-cafes.dto';
import { TopCafesDto } from './dto/top-cafes.dto';

@ApiTags('cafes')
@Controller('cafes')
export class CafesController {
  constructor(private readonly cafesService: CafesService) {}

  /** Search and filter cafés. Pass lat/lng to get `distanceKm` and geo filtering. */
  @Get()
  findAll(@Query() query: QueryCafesDto): Promise<PaginatedCafesDto> {
    return this.cafesService.findAll(query);
  }

  /** Ranked list for "Top 10" pages. */
  @Get('top')
  findTop(@Query() query: TopCafesDto): Promise<CafeResponseDto[]> {
    return this.cafesService.findTop(query);
  }

  /** Values available for building filter UIs. */
  @Get('filters')
  getFilters(): Promise<CafeFiltersDto> {
    return this.cafesService.getFilters();
  }

  // Declared last so "top" and "filters" aren't captured as slugs.
  @Get(':slug')
  findOne(
    @Param('slug') slug: string,
    @Query() { lang }: LangQueryDto,
  ): Promise<CafeResponseDto> {
    return this.cafesService.findBySlug(slug, lang);
  }
}
