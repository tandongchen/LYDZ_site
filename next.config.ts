import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The standard Next.js build used by Netlify should type-check only the
  // Next.js application. Cloudflare Worker/D1 sources keep using tsconfig.json.
  typescript: {
    tsconfigPath: "tsconfig.netlify.json",
  },
};

export default nextConfig;
