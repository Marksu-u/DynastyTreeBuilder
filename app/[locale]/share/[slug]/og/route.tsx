import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { renderOgCard, renderBrandCard } from "@/lib/og-card";
import { buildOgGraph } from "@/lib/og-tree";
import { resolveCrestSeed } from "@/lib/crest";

// A route handler rather than `opengraph-image.tsx` for two reasons: Prisma with
// the pg adapter cannot run on edge, and the file convention gives no control
// over the URL, which has to carry the ?v= cache-busting hash.
export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; locale: string }> },
) {
  const { slug, locale } = await params;

  const dynasty = await prisma.dynasty.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      setting: true,
      isPublic: true,
      crestSeed: true,
      characters: { select: { id: true, flags: true } },
      relationships: { select: { fromId: true, toId: true, type: true } },
    },
  });

  // Deliberately a separate code path from the page's notFound(): this image is
  // fetchable by anyone, so it must never render a private dynasty's structure.
  if (!dynasty || !dynasty.isPublic) return renderBrandCard();
  if (dynasty.characters.length === 0) return renderBrandCard();

  const { nodes, edges, founderIds } = buildOgGraph(
    dynasty.characters.map((c) => ({ id: c.id, flags: c.flags as string[] })),
    dynasty.relationships,
  );

  const count = dynasty.characters.length;
  const t = await getTranslations({ locale, namespace: "share" });
  const tSetting = await getTranslations({ locale, namespace: "settings" });
  const setting = tSetting.has(dynasty.setting)
    ? tSetting(dynasty.setting)
    : dynasty.setting;

  return renderOgCard({
    houseName: dynasty.name,
    meta: t("ogMeta", { setting, count }),
    crestSeed: resolveCrestSeed(dynasty),
    nodes,
    edges,
    founderIds,
  });
}
