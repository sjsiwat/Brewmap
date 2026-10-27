import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, mongo } from 'mongoose';
import { CafesService } from '../cafes/cafes.service';
import { UsersService } from '../users/users.service';
import {
  CreateReviewDto,
  MyReviewDto,
  PaginatedReviewsDto,
  QueryReviewsDto,
  ReviewResponseDto,
  UpdateReviewDto,
  toReviewResponse,
} from './dto/review.dto';
import { Review, ReviewDocument } from './schemas/review.schema';

type LeanReview = Review & { _id: Types.ObjectId };

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    private readonly cafesService: CafesService,
    private readonly usersService: UsersService,
  ) {}

  /** A café's reviews, newest first, with its current community totals. */
  async listForCafe(
    slug: string,
    query: QueryReviewsDto,
  ): Promise<PaginatedReviewsDto> {
    const cafeId = await this.cafesService.findIdBySlug(slug);
    const [items, total] = await Promise.all([
      this.reviewModel
        .find({ cafeId })
        // _id breaks ties so pages never repeat or skip a review.
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<LeanReview[]>(),
      this.reviewModel.countDocuments({ cafeId }),
    ]);
    const stats = await this.statsFor(cafeId);
    return {
      items: await this.withAuthors(items),
      total,
      page: query.page,
      limit: query.limit,
      ...stats,
    };
  }

  async mine(userId: string, slug: string): Promise<MyReviewDto> {
    const cafeId = await this.cafesService.findIdBySlug(slug);
    const review = await this.reviewModel
      .findOne({ userId: new Types.ObjectId(userId), cafeId })
      .lean<LeanReview>();
    return { review: review ? (await this.withAuthors([review]))[0] : null };
  }

  async create(
    userId: string,
    slug: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const cafeId = await this.cafesService.findIdBySlug(slug);
    let review: ReviewDocument;
    try {
      review = await this.reviewModel.create({
        userId: new Types.ObjectId(userId),
        cafeId,
        rating: dto.rating,
        text: dto.text,
        drinkOrdered: dto.drinkOrdered || undefined,
      });
    } catch (error) {
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new ConflictException(
          'You already reviewed this café - edit your review instead',
        );
      }
      throw error;
    }
    await this.refreshStats(cafeId);
    return (await this.withAuthors([review.toObject<LeanReview>()]))[0];
  }

  async update(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.findOwned(userId, reviewId);
    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.text !== undefined) review.text = dto.text;
    if (dto.drinkOrdered !== undefined) {
      review.drinkOrdered = dto.drinkOrdered || undefined;
    }
    await review.save();
    await this.refreshStats(review.cafeId);
    return (await this.withAuthors([review.toObject<LeanReview>()]))[0];
  }

  async remove(userId: string, reviewId: string): Promise<void> {
    const review = await this.findOwned(userId, reviewId);
    await review.deleteOne();
    await this.refreshStats(review.cafeId);
  }

  /** 404 if the review doesn't exist, 403 if it belongs to someone else. */
  private async findOwned(
    userId: string,
    reviewId: string,
  ): Promise<ReviewDocument> {
    const review = Types.ObjectId.isValid(reviewId)
      ? await this.reviewModel.findById(reviewId)
      : null;
    if (!review) throw new NotFoundException('Review not found');
    if (!review.userId.equals(userId)) {
      throw new ForbiddenException('You can only change your own review');
    }
    return review;
  }

  private async statsFor(cafeId: Types.ObjectId): Promise<{
    communityRating: number | null;
    communityReviewCount: number;
  }> {
    const [stats] = await this.reviewModel.aggregate<{
      average: number;
      count: number;
    }>([
      { $match: { cafeId } },
      {
        $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } },
      },
    ]);
    return stats
      ? {
          communityRating: Math.round(stats.average * 10) / 10,
          communityReviewCount: stats.count,
        }
      : { communityRating: null, communityReviewCount: 0 };
  }

  /** Recomputed from all reviews (not incremented), so it can't drift. */
  private async refreshStats(cafeId: Types.ObjectId): Promise<void> {
    await this.cafesService.setCommunityStats(
      cafeId,
      await this.statsFor(cafeId),
    );
  }

  private async withAuthors(
    reviews: LeanReview[],
  ): Promise<ReviewResponseDto[]> {
    const names = await this.usersService.displayNames(
      reviews.map((r) => r.userId),
    );
    return reviews.map((r) =>
      toReviewResponse(r, names.get(r.userId.toString())),
    );
  }
}
