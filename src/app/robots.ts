import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/explore", "/showcase/"],
      disallow: ["/feed", "/settings", "/notifications", "/bookmarks", "/api/"],
    },
    sitemap: "https://network.vexory.xyz/sitemap.xml",
  };
}
