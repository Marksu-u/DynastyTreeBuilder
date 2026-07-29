import { prisma } from "@/lib/prisma";
import { renderOgCard, renderBrandCard } from "@/lib/og-card";
import { buildOgGraph } from "@/lib/og-tree";
import { resolveCrestSeed } from "@/lib/crest";

// A route handler rather than `opengraph-image.tsx` for two reasons: Prisma with
// the pg adapter cannot run on edge, and the file convention gives no control
// over the URL, which has to carry the ?v= cache-busting hash.
export const runtime = "nodejs";
export const revalidate = 3600;

const SETTING_LABELS: Record<string, string> = {
  FANTASY: "Fantasy",
  SCI_FI: "Sci-Fi",
  HISTORICAL: "Historical",
  MODERN: "Modern",
  HORROR: "Horror",
  OTHER: "Other",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

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
  const setting = SETTING_LABELS[dynasty.setting] ?? dynasty.setting;

  return renderOgCard({
    houseName: dynasty.name,
    meta: `${setting} · ${count} ${count === 1 ? "character" : "characters"}`,
    crestSeed: resolveCrestSeed(dynasty),
    nodes,
    edges,
    founderIds,
  });
}
