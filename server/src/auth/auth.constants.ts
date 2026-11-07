import type { CookieOptions } from 'express';

export const AUTH_COOKIE = 'access_token';

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/** JWT payload: `sub` is the user id, `ver` the user's tokenVersion at login. */
export interface JwtPayload {
  sub: string;
  ver: number;
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

/** Shortest JWT_SECRET accepted in production: 32 characters (256 bits as hex is 64). */
export const JWT_SECRET_MIN = 32;

const PLACEHOLDER_SECRETS = new Set(['change-me', 'changeme', 'secret']);

/**
 * JWT_SECRET, checked. Anyone who knows or guesses the secret can sign a
 * token for any account, so in production a missing, placeholder or short
 * one stops the server from starting instead of running unsafely.
 */
export function jwtSecret(value: string | undefined, nodeEnv?: string): string {
  if (!value) throw new Error('JWT_SECRET is not set');
  const weak =
    PLACEHOLDER_SECRETS.has(value.toLowerCase()) ||
    value.length < JWT_SECRET_MIN;
  if (weak && nodeEnv === 'production') {
    throw new Error(
      `JWT_SECRET is too weak for production: use ${JWT_SECRET_MIN}+ random characters (e.g. openssl rand -hex 32)`,
    );
  }
  return value;
}
