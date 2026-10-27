import type { CookieOptions } from 'express';

export const AUTH_COOKIE = 'access_token';

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/** JWT payload: `sub` is the user id. */
export interface JwtPayload {
  sub: string;
}

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    // In production the web app proxies /api to the server (D3), so the cookie
    // stays first-party and only needs to be Secure.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}
