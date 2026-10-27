import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GoogleReviewsResponseDto } from './dto/google-review.dto';
import { GoogleReviewsService } from './google-reviews.service';

@ApiTags('google-reviews')
@Controller()
export class GoogleReviewsController {
  constructor(private readonly googleReviewsService: GoogleReviewsService) {}

  /** What Google Maps reviewers wrote about the café, newest first. Anonymous. */
  @Get('cafes/:slug/google-reviews')
  list(@Param('slug') slug: string): Promise<GoogleReviewsResponseDto> {
    return this.googleReviewsService.listForCafe(slug);
  }
}
