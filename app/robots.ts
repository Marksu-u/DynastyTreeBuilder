import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      // /share stays crawlable on purpose: a disallowed URL can never be read,
      // so its `noindex` would never be seen and the URL could still surface.
      allow: ["/", "/share/"],
      disallow: ["/dashboard/", "/api/", "/login"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
