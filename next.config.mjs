import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => ({
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ] }];
  },
  // Ship committed posts with the serverless functions that read them.
  // Every route that lists posts (blog pages, RSS, sitemap, uploads) needs them.
  outputFileTracingIncludes: { "/**": ["./content/blog/**/*"] },
  // `next dev` writes its own folder, so a running dev server can't overwrite the
  // production build that `next build` / `next start` use. NEXT_DIST_DIR overrides both.
  distDir: process.env.NEXT_DIST_DIR || (phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"),
});
export default nextConfig;
