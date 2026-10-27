import type { NextConfig } from "next";

// Where the NestJS API lives. Server-side only: the browser always calls /api on
// this origin and the rewrite below proxies it, so the auth cookie is first-party (D3).
const API_URL = (process.env.API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

const isDev = process.env.NODE_ENV === "development";

// No nonces: they force every page to render dynamically, and the café pages
// are static/ISR. So inline scripts stay allowed (Next's hydration data), but
// nothing loads from other origins except the OpenStreetMap embed, plugins
// and <base> are off, and forms can only post back here. All API calls go to
// our own /api (proxied below), so connect-src is 'self' too. Dev adds eval
// and the HMR websocket for React Refresh.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src https://www.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nobody may frame BrewMap (clickjacking on /login, the review form...).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // "Use my location" is the only browser feature we ask for.
          { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
        ],
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
  // The repo root also has a package-lock.json (for `npm run dev`), so pin the
  // workspace root to web/ instead of letting Next infer the parent folder.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
