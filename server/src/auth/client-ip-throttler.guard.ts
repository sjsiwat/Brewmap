import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { isIP } from 'net';

export const CLIENT_IP_HEADER = 'x-client-ip';
export const PROXY_SECRET_HEADER = 'x-proxy-secret';

function secretMatches(
  given: string | string[] | undefined,
  expected: string,
): boolean {
  if (typeof given !== 'string' || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Rate-limits per real visitor even though browser traffic reaches us through
 * the web app's /api proxy (D3), where every request would otherwise share the
 * proxy's address. The proxy forwards the visitor's IP in `x-client-ip` together
 * with PROXY_SECRET; without a matching secret the header is ignored, so callers
 * can't pick their own bucket. Everything else uses req.ip (see TRUST_PROXY).
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const secret = process.env.PROXY_SECRET;
    const clientIp = req.headers[CLIENT_IP_HEADER];
    if (
      secret &&
      typeof clientIp === 'string' &&
      isIP(clientIp) &&
      secretMatches(req.headers[PROXY_SECRET_HEADER], secret)
    ) {
      return Promise.resolve(clientIp);
    }
    return super.getTracker(req);
  }
}
