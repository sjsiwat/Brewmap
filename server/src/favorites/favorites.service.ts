import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, mongo } from 'mongoose';
import { CafesService } from '../cafes/cafes.service';
import { CafeResponseDto } from '../cafes/dto/cafe-response.dto';
import { Favorite } from './schemas/favorite.schema';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<Favorite>,
    private readonly cafesService: CafesService,
  ) {}

  /** The user's favorite cafés, most recently added first. */
  async list(userId: string): Promise<CafeResponseDto[]> {
    const favorites = await this.favoriteModel
      .find({ userId: new Types.ObjectId(userId) }, { cafeId: 1 })
      .sort({ createdAt: -1 })
      .lean<Pick<Favorite, 'cafeId'>[]>();
    return this.cafesService.findByIds(favorites.map((f) => f.cafeId));
  }

  /** Idempotent: adding a café that is already a favorite is a no-op. */
  async add(userId: string, slug: string): Promise<void> {
    const cafeId = await this.cafesService.findIdBySlug(slug);
    const key = { userId: new Types.ObjectId(userId), cafeId };
    try {
      await this.favoriteModel.updateOne(
        key,
        { $setOnInsert: key },
        { upsert: true },
      );
    } catch (error) {
      // Two simultaneous upserts: the loser hits the unique index - already added.
      if (!(error instanceof mongo.MongoServerError && error.code === 11000)) {
        throw error;
      }
    }
  }

  /** Idempotent: removing a café that isn't a favorite is a no-op. */
  async remove(userId: string, slug: string): Promise<void> {
    const cafeId = await this.cafesService.findIdBySlug(slug);
    await this.favoriteModel.deleteOne({
      userId: new Types.ObjectId(userId),
      cafeId,
    });
  }
}
