import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUserId, JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateReviewDto,
  MyReviewDto,
  PaginatedReviewsDto,
  QueryReviewsDto,
  ReviewResponseDto,
  UpdateReviewDto,
} from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** Newest first. Unknown café -> 404. */
  @Get('cafes/:slug/reviews')
  list(
    @Param('slug') slug: string,
    @Query() query: QueryReviewsDto,
  ): Promise<PaginatedReviewsDto> {
    return this.reviewsService.listForCafe(slug, query);
  }

  @Get('cafes/:slug/reviews/mine')
  @UseGuards(JwtAuthGuard)
  mine(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
  ): Promise<MyReviewDto> {
    return this.reviewsService.mine(userId, slug);
  }

  /** One review per user per café: a second one -> 409. */
  @Post('cafes/:slug/reviews')
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.create(userId, slug, dto);
  }

  /** Author only (403 otherwise). */
  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.update(userId, id, dto);
  }

  /** Author only (403 otherwise). */
  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.reviewsService.remove(userId, id);
  }
}
