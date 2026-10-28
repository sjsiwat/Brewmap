import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUserId, JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  UserThrottlerGuard,
  WRITE_RATE_LIMIT,
} from '../auth/user-throttler.guard';
import { CafeResponseDto } from '../cafes/dto/cafe-response.dto';
import { LangQueryDto } from '../cafes/dto/lang.dto';
import { FavoritesService } from './favorites.service';

/** The logged-in user's favorites. Unknown café slug -> 404. */
@ApiTags('favorites')
@Controller('me/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Query() { lang }: LangQueryDto,
  ): Promise<CafeResponseDto[]> {
    return this.favoritesService.list(userId, lang);
  }

  @Put(':slug')
  @UseGuards(UserThrottlerGuard)
  @Throttle(WRITE_RATE_LIMIT)
  @HttpCode(HttpStatus.NO_CONTENT)
  add(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.favoritesService.add(userId, slug);
  }

  @Delete(':slug')
  @UseGuards(UserThrottlerGuard)
  @Throttle(WRITE_RATE_LIMIT)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.favoritesService.remove(userId, slug);
  }
}
