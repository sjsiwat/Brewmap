import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Runs before the /api rewrite in next.config.ts. Every proxied request reaches
 * the API from this server's address, so we pass the visitor's IP along for the
 * login rate limit, signed with PROXY_SECRET (see ClientIpThrottlerGuard).
 *
 * The visitor IP comes from x-real-ip / x-forwarded-for, which Vercel overwrites
 * with the real client address. A plain `next start` passes them through from the
 * client, so leave PROXY_SECRET unset unless a platform like Vercel sets them.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  // Never let a visitor supply these themselves.
  headers.delete("x-client-ip");
  headers.delete("x-proxy-secret");

  const secret = process.env.PROXY_SECRET;
  const clientIp =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (secret && clientIp) {
    headers.set("x-client-ip", clientIp);
    headers.set("x-proxy-secret", secret);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: "/api/:path*",
};
