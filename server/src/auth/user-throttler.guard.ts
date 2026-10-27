import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { ClientIpThrottlerGuard } from './client-ip-throttler.guard';

/** Writes per logged-in user per minute: enough for real use, not for a script. */
export const WRITE_RATE_LIMIT = { default: { limit: 30, ttl: 60_000 } };

/**
 * Rate-limits per account rather than per IP, so one user can't flood reviews
 * or favorites from many addresses, and users sharing an IP (or the web proxy)
 * don't eat each other's quota. Must run after JwtAuthGuard, which sets userId;
 * without one it falls back to the visitor IP, proxy-aware like the auth limit.
 */
@Injectable()
export class UserThrottlerGuard extends ClientIpThrottlerGuard {
  protected getTracker(req: Request & { userId?: string }): Promise<string> {
    return req.userId
      ? Promise.resolve(`user:${req.userId}`)
      : super.getTracker(req);
  }
}
