import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // App areas are NOT disallowed here on purpose: a blocked URL can still be
      // indexed from links, and Google never sees its noindex. next.config.ts
      // sends X-Robots-Tag: noindex for them instead.
      disallow: ["/api/"],
    },
    sitemap: "https://camperroster.com/sitemap.xml",
  };
}
