import type { NextConfig } from "next";

// Logged-in app areas, auth screens, and camp-scoped forms. They are useless as
// search results (anonymous visitors get bounced to /login or a "pick a camp"
// blocker) and Search Console showed Google indexing /admin, /nurse/emar,
// /canteen/pos, /portal, /register and /volunteer. A response header is used
// rather than robots.txt so the redirects to /login carry it too and Google can
// actually see the noindex and drop the URLs.
const NOINDEX_PATHS = [
  "/admin",
  "/nurse",
  "/counselor",
  "/canteen",
  "/billing",
  "/portal",
  "/staff",
  "/auth",
  "/login",
  "/signup",
  "/reset-password",
  "/no-access",
  "/setup-incomplete",
  "/register",
  "/volunteer"
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  async redirects() {
    // www and the vercel.app alias both served full duplicate copies of the
    // site, and Search Console split impressions between www and apex URLs.
    return ["www.camperroster.com", "camperroster.vercel.app"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://camperroster.com/:path*",
      permanent: true
    }));
  },
  async headers() {
    return NOINDEX_PATHS.flatMap((p) => [p, `${p}/:path*`]).map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }]
    }));
  }
};

export default nextConfig;
