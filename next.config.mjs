/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Lets a production check build alongside a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
