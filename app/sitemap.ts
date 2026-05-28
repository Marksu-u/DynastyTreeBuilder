import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const publicDynasties = await prisma.dynasty.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true },
  });

  return publicDynasties.map((dynasty) => ({
    url: `${siteUrl}/share/${dynasty.slug}`,
    lastModified: dynasty.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
