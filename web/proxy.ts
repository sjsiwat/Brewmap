import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, hasLocale, type Locale } from "@/lib/i18n/config";

/**
 * /api: runs before the rewrite in next.config.ts. Every proxied request reaches
 * the API from this server's address, so we pass the visitor's IP along for the
 * login rate limit, signed with PROXY_SECRET (see ClientIpThrottlerGuard).
 *
 * The visitor IP comes from x-real-ip / x-forwarded-for, which Vercel overwrites
 * with the real client address. A plain `next start` passes them through from the
 * client, so leave PROXY_SECRET unset unless a platform like Vercel sets them.
 */
function forwardToApi(request: NextRequest) {
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

/** The language a visitor last chose, else the first of ours in Accept-Language, else English. */
function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (hasLocale(saved)) return saved;
  const accepted = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q === undefined ? 1 : Number(q) };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q);
  return accepted.map((entry) => entry.lang).find(hasLocale) ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api" || pathname.startsWith("/api/")) return forwardToApi(request);

  // Pages: every URL starts with /en or /th. Remember the one in use, so a
  // bare link (/cafes) later opens in the same language.
  const first = pathname.split("/")[1];
  if (hasLocale(first)) {
    const response = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      response.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // /api, and every page path - not Next's own files or anything with a file extension.
  matcher: ["/api/:path*", "/((?!_next/|.*\\..*).*)"],
};
