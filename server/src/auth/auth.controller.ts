import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { UserResponseDto } from '../users/user-response.dto';
import {
  AUTH_COOKIE,
  SESSION_TTL_SECONDS,
  authCookieOptions,
} from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { CurrentUserId, JwtAuthGuard } from './jwt-auth.guard';

// Brute-force protection: per client IP, on the endpoints that take a password.
const AUTH_RATE_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Creates the account. Does not log in - call /auth/login next. */
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle(AUTH_RATE_LIMIT)
  register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle(AUTH_RATE_LIMIT)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const { user, token } = await this.authService.login(dto);
    res.cookie(AUTH_COOKIE, token, {
      ...authCookieOptions(),
      maxAge: SESSION_TTL_SECONDS * 1000,
    });
    return user;
  }

  /** Always succeeds, so logging out twice (or with an expired cookie) is fine. */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(AUTH_COOKIE, authCookieOptions());
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUserId() userId: string): Promise<UserResponseDto> {
    return this.authService.me(userId);
  }
}
