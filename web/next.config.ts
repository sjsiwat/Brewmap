import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root also has a package-lock.json (for `npm run dev`), so pin the
  // workspace root to web/ instead of letting Next infer the parent folder.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
