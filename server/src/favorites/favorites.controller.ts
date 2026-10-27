import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUserId, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CafeResponseDto } from '../cafes/dto/cafe-response.dto';
import { FavoritesService } from './favorites.service';

/** The logged-in user's favorites. Unknown café slug -> 404. */
@ApiTags('favorites')
@Controller('me/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUserId() userId: string): Promise<CafeResponseDto[]> {
    return this.favoritesService.list(userId);
  }

  @Put(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  add(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.favoritesService.add(userId, slug);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.favoritesService.remove(userId, slug);
  }
}
