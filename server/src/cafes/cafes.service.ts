import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import {
  CafeFiltersDto,
  CafeResponseDto,
  PaginatedCafesDto,
  toCafeResponse,
} from './dto/cafe-response.dto';
import { CafeSort, QueryCafesDto } from './dto/query-cafes.dto';
import { TopCafesDto } from './dto/top-cafes.dto';
import { Cafe, DRINK_TYPES } from './schemas/cafe.schema';

type GeoCafe = Cafe & { distanceMeters: number };

// `slug` is the final tie-breaker so pagination is stable.
const SORT_ORDERS: Record<CafeSort, Record<string, 1 | -1>> = {
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

    if (lat === undefined || lng === undefined) {
      const [items, total] = await Promise.all([
        this.cafeModel
          .find(filter)
          .sort(SORT_ORDERS[sort])
          .skip(skip)
          .limit(query.limit)
          .lean<Cafe[]>(),
        this.cafeModel.countDocuments(filter),
      ]);
      return {
        items: items.map(toCafeResponse),
        total,
        page: query.page,
        limit: query.limit,
      };
    }

    // $geoNear must be the first stage; it computes distance for every match,
    // then $facet returns one page plus the total in a single round trip.
    const [result] = await this.cafeModel.aggregate<{
      items: GeoCafe[];
      total: { count: number }[];
    }>([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          spherical: true,
          query: filter,
          ...(query.radiusKm !== undefined && {
            maxDistance: query.radiusKm * 1000,
          }),
        },
      },
      { $sort: SORT_ORDERS[sort] },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: query.limit }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    return {
      items: result.items.map(toCafeResponse),
      total: result.total[0]?.count ?? 0,
      page: query.page,
      limit: query.limit,
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
    return cafes.map(toCafeResponse);
  }

  async findBySlug(slug: string): Promise<CafeResponseDto> {
    const cafe = await this.cafeModel.findOne({ slug }).lean<Cafe>();
    if (!cafe) throw new NotFoundException(`Café "${slug}" not found`);
    return toCafeResponse(cafe);
  }

  /** The café's document id, for other collections to reference. */
  async findIdBySlug(slug: string): Promise<Types.ObjectId> {
    const cafe = await this.cafeModel
      .findOne({ slug }, { _id: 1 })
      .lean<{ _id: Types.ObjectId }>();
    if (!cafe) throw new NotFoundException(`Café "${slug}" not found`);
    return cafe._id;
  }

  /** Cafés in the order of `ids`; ids with no café are skipped. */
  async findByIds(ids: Types.ObjectId[]): Promise<CafeResponseDto[]> {
    const cafes = await this.cafeModel
      .find({ _id: { $in: ids } })
      .lean<(Cafe & { _id: Types.ObjectId })[]>();
    const byId = new Map(cafes.map((cafe) => [cafe._id.toString(), cafe]));
    return ids.flatMap((id) => {
      const cafe = byId.get(id.toString());
      return cafe ? [toCafeResponse(cafe)] : [];
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
    return filter;
  }
}
