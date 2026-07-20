import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Shared dynasties are deliberately absent: they are user content served with
  // `noindex`, so listing them would only feed Search Console excluded-page noise.
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1.0 },
    { url: `${siteUrl}/tree`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
