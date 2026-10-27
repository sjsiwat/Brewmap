import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CafesModule } from '../cafes/cafes.module';
import { GoogleReviewsController } from './google-reviews.controller';
import { GoogleReviewsService } from './google-reviews.service';
import {
  GoogleReview,
  GoogleReviewSchema,
} from './schemas/google-review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoogleReview.name, schema: GoogleReviewSchema },
    ]),
    CafesModule,
  ],
  controllers: [GoogleReviewsController],
  providers: [GoogleReviewsService],
})
export class GoogleReviewsModule {}
