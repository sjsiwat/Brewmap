import type { NextConfig } from "next";

// Where the NestJS API lives. Server-side only: the browser always calls /api on
// this origin and the rewrite below proxies it, so the auth cookie is first-party (D3).
const API_URL = (process.env.API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nobody may frame BrewMap (clickjacking on /login, the review form...).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
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
