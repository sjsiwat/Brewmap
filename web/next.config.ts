import type { NextConfig } from "next";

// Where the NestJS API lives. Server-side only: the browser always calls /api on
// this origin and the rewrite below proxies it, so the auth cookie is first-party (D3).
const API_URL = (process.env.API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

const nextConfig: NextConfig = {
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
