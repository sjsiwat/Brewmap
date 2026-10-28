import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, QueryFilter, Types } from 'mongoose';
import {
  CafeFiltersDto,
  CafeResponseDto,
  PaginatedCafesDto,
  toCafeResponse,
} from './dto/cafe-response.dto';
import { CafeSort, QueryCafesDto, searchWords } from './dto/query-cafes.dto';
import type { Lang } from './lang';
import { TopCafesDto } from './dto/top-cafes.dto';
import { openAtFilter } from './opening-hours';
import { Cafe, DRINK_TYPES } from './schemas/cafe.schema';

type ListedCafe = Cafe & { distanceMeters?: number };

/**
 * How many reviews a café needs before its own rating counts as much as the
 * average of all cafés: roughly the median review count (246) in our data.
 */
export const RECOMMENDED_PRIOR_REVIEWS = 250;

// `slug` is the final tie-breaker so pagination is stable.
const SORT_ORDERS: Record<CafeSort, Record<string, 1 | -1>> = {
  recommended: { score: -1, reviewCount: -1, slug: 1 },
  rating: { rating: -1, reviewCount: -1, slug: 1 },
  reviews: { reviewCount: -1, rating: -1, slug: 1 },
  price: { priceAvg: 1, rating: -1, slug: 1 },
  distance: { distanceMeters: 1, slug: 1 },
};

@Injectable()
export class CafesService {
  constructor(
    @InjectModel(Cafe.name) private readonly cafeModel: Model<Cafe>,
  ) {}

  async findAll(query: QueryCafesDto): Promise<PaginatedCafesDto> {
    const { lat, lng } = query;
    const hasOrigin = lat !== undefined && lng !== undefined;
    const sort = query.sort ?? (hasOrigin ? 'distance' : 'rating');

    if (!hasOrigin && (query.radiusKm !== undefined || sort === 'distance')) {
      throw new BadRequestException(
        'lat and lng are required for radiusKm or sort=distance',
      );
    }
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice must be <= maxPrice');
    }

    const filter = this.buildFilter(query);
    const skip = (query.page - 1) * query.limit;

    // $geoNear must be the first stage; it computes distance for every match.
    const pipeline: PipelineStage[] = [
      hasOrigin
        ? {
            $geoNear: {
              near: { type: 'Point', coordinates: [lng, lat] },
              distanceField: 'distanceMeters',
              spherical: true,
              query: filter,
              ...(query.radiusKm !== undefined && {
                maxDistance: query.radiusKm * 1000,
              }),
            },
          }
        : { $match: filter },
    ];
    if (sort === 'recommended') {
      pipeline.push({ $addFields: { score: await this.recommendedScore() } });
    }
    // $facet returns one page plus the total in a single round trip.
    const [result] = await this.cafeModel.aggregate<{
      items: ListedCafe[];
      total: { count: number }[];
    }>([
      ...pipeline,
      { $sort: SORT_ORDERS[sort] },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: query.limit }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    return {
      items: result.items.map((cafe) => toCafeResponse(cafe, query.lang)),
      total: result.total[0]?.count ?? 0,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Bayesian average: (n * rating + m * mean) / (n + m), where n is the café's
   * review count, m is RECOMMENDED_PRIOR_REVIEWS and mean is the average rating
   * of every café. Few reviews pull a café towards the mean; many keep its own.
   */
  private async recommendedScore() {
    const [stats] = await this.cafeModel.aggregate<{ mean: number }>([
      { $group: { _id: null, mean: { $avg: '$rating' } } },
    ]);
    const m = RECOMMENDED_PRIOR_REVIEWS;
    return {
      $divide: [
        {
          $add: [
            { $multiply: ['$reviewCount', '$rating'] },
            m * (stats?.mean ?? 0),
          ],
        },
        { $add: ['$reviewCount', m] },
      ],
    };
  }

  async findTop(query: TopCafesDto): Promise<CafeResponseDto[]> {
    const filter: QueryFilter<Cafe> = {
      reviewCount: { $gte: query.minReviews },
    };
    if (query.tag) filter.tags = query.tag;

    const cafes = await this.cafeModel
      .find(filter)
      .sort(SORT_ORDERS.rating)
      .limit(query.limit)
      .lean<Cafe[]>();
    return cafes.map((cafe) => toCafeResponse(cafe, query.lang));
  }

  async findBySlug(slug: string, lang?: Lang): Promise<CafeResponseDto> {
    const cafe = await this.cafeModel.findOne({ slug }).lean<Cafe>();
    if (!cafe) throw new NotFoundException(`Café "${slug}" not found`);
    return toCafeResponse(cafe, lang);
  }

  /** The café's document id, for other collections to reference. */
  async findIdBySlug(slug: string): Promise<Types.ObjectId> {
    const cafe = await this.cafeModel
      .findOne({ slug }, { _id: 1 })
      .lean<{ _id: Types.ObjectId }>();
    if (!cafe) throw new NotFoundException(`Café "${slug}" not found`);
    return cafe._id;
  }

  async setCommunityStats(
    cafeId: Types.ObjectId,
    stats: { communityRating: number | null; communityReviewCount: number },
  ): Promise<void> {
    await this.cafeModel.updateOne({ _id: cafeId }, { $set: stats });
  }

  /** Cafés in the order of `ids`; ids with no café are skipped. */
  async findByIds(
    ids: Types.ObjectId[],
    lang?: Lang,
  ): Promise<CafeResponseDto[]> {
    const cafes = await this.cafeModel
      .find({ _id: { $in: ids } })
      .lean<(Cafe & { _id: Types.ObjectId })[]>();
    const byId = new Map(cafes.map((cafe) => [cafe._id.toString(), cafe]));
    return ids.flatMap((id) => {
      const cafe = byId.get(id.toString());
      return cafe ? [toCafeResponse(cafe, lang)] : [];
    });
  }

  async getFilters(): Promise<CafeFiltersDto> {
    const [areas, tags, [price]] = await Promise.all([
      this.cafeModel.distinct('area'),
      this.cafeModel.distinct('tags'),
      this.cafeModel.aggregate<{ min: number; max: number }>([
        {
          $group: {
            _id: null,
            min: { $min: '$priceAvg' },
            max: { $max: '$priceAvg' },
          },
        },
      ]),
    ]);
    return {
      areas: areas.sort(),
      tags: tags.sort(),
      drinkTypes: [...DRINK_TYPES],
      priceRange: { min: price?.min ?? 0, max: price?.max ?? 0 },
    };
  }

  private buildFilter(query: QueryCafesDto): QueryFilter<Cafe> {
    const filter: QueryFilter<Cafe> = {};
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.priceAvg = {
        ...(query.minPrice !== undefined && { $gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { $lte: query.maxPrice }),
      };
    }
    if (query.drinkType) filter.drinkType = query.drinkType;
    if (query.parking !== undefined) filter.parking = query.parking;
    if (query.petFriendly !== undefined) filter.petFriendly = query.petFriendly;
    if (query.tag) filter.tags = query.tag;
    if (query.area) filter.area = query.area;
    if (query.openNow) Object.assign(filter, openAtFilter(new Date()));
    if (query.q) {
      // Escaped, so the search is plain text, never a user-supplied regex.
      const words = searchWords(query.q).map(
        (word) => new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      );
      if (words.length) filter.$and = words.map((word) => ({ name: word }));
    }
    return filter;
  }
}
