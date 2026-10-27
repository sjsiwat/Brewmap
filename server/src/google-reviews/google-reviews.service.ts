import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CafesService } from '../cafes/cafes.service';
import { GoogleReviewsResponseDto } from './dto/google-review.dto';
import { GoogleReview } from './schemas/google-review.schema';

@Injectable()
export class GoogleReviewsService {
  constructor(
    @InjectModel(GoogleReview.name)
    private readonly googleReviewModel: Model<GoogleReview>,
    private readonly cafesService: CafesService,
  ) {}

  /** All of a café's imported Google reviews, newest first. Unknown café -> 404. */
  async listForCafe(slug: string): Promise<GoogleReviewsResponseDto> {
    const cafeId = await this.cafesService.findIdBySlug(slug);
    const reviews = await this.googleReviewModel
      .find({ cafeId })
      .sort({ publishedAt: -1, _id: 1 })
      .lean();
    const items = reviews.map((r) => ({
      rating: r.rating,
      text: r.text,
      translatedText: r.translatedText ?? null,
      language: r.language ?? null,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    }));
    return { items, total: items.length };
  }
}
