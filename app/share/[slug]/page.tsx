import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { prisma } from "@/lib/prisma";
import { ShareCanvas } from "@/components/canvas/ShareCanvas";
import { Crest } from "@/components/ui/Crest";
import { resolveCrestSeed, crestCacheKey } from "@/lib/crest";
import "@xyflow/react/dist/style.css";
import type { CharacterNodeType, LegacyEdgeType } from "@/store/canvas";
import type {
  CharacterFlag,
  CharacterGender,
  LegacyRelationshipType,
} from "@/types/canvas";

export const revalidate = 60;

const SETTING_LABELS: Record<string, string> = {
  FANTASY: "Fantasy",
  SCI_FI: "Sci-Fi",
  HISTORICAL: "Historical",
  MODERN: "Modern",
  HORROR: "Horror",
  OTHER: "Other",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dynasty = await prisma.dynasty.findUnique({
    where: { slug },
    select: { name: true, slug: true, setting: true, isPublic: true, crestSeed: true },
  });

  // Shared trees are user content: linkable and previewable, but kept out of
  // search indexes. `follow` still lets crawlers walk back to the marketing pages.
  const robots = { index: false, follow: true } as const;

  if (!dynasty || !dynasty.isPublic) {
    return { title: "Tree not found", robots };
  }

  const setting = SETTING_LABELS[dynasty.setting] ?? dynasty.setting;
  const description = `Explore the ${dynasty.name} dynasty tree — a ${setting.toLowerCase()} family tree built with Dynasty Tree Builder.`;

  // This override is load-bearing. The root layout sets a global
  // `openGraph.images` pointing at /opengraph-image, which every share page
  // inherits — that inheritance is why shared dynasties used to preview as the
  // landing card. The ?v= hash changes when the crest changes, so platforms
  // holding a scraped copy refetch instead of showing stale arms.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const v = crestCacheKey(resolveCrestSeed(dynasty));
  const images = [
    { url: `${siteUrl}/share/${slug}/og?v=${v}`, width: 1200, height: 630 },
  ];

  return {
    title: dynasty.name,
    description,
    robots,
    alternates: { canonical: `/share/${slug}` },
    openGraph: {
      title: `${dynasty.name} · Dynasty Tree Builder`,
      description,
      type: "article",
      url: `/share/${slug}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${dynasty.name} · Dynasty Tree Builder`,
      description,
      images,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const dynasty = await prisma.dynasty.findUnique({
    where: { slug },
    include: { characters: true, relationships: true },
  });

  if (!dynasty || !dynasty.isPublic) notFound();

  const nodes: CharacterNodeType[] = dynasty.characters.map((char) => ({
    id: char.id,
    type: "character" as const,
    position: { x: char.posX, y: char.posY },
    data: {
      name: char.name,
      alias: char.alias ?? undefined,
      flags: char.flags as CharacterFlag[],
      style: char.style,
      gender: char.gender as CharacterGender,
      note: char.note ?? undefined,
      isReadOnly: true,
    },
  }));

  const edges: LegacyEdgeType[] = dynasty.relationships.map((rel) => ({
    id: rel.id,
    type: "relationship" as const,
    source: rel.fromId,
    target: rel.toId,
    data: {
      type: rel.type as LegacyRelationshipType,
      hook: rel.hook ?? undefined,
      isMutual: rel.isMutual,
    },
  }));

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center gap-4 border-b border-zinc-800 px-4">
          <span className="flex items-center gap-2">
            <Crest seed={resolveCrestSeed(dynasty)} size={22} />
            <span className="text-sm font-medium text-zinc-200">{dynasty.name}</span>
          </span>
          <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {SETTING_LABELS[dynasty.setting] ?? dynasty.setting}
          </span>
          <Link
            href="/"
            className="ml-auto text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Dynasty Tree Builder
          </Link>
        </header>
        <div className="flex-1 overflow-hidden">
          <ShareCanvas
            dynastyName={dynasty.name}
            shareSlug={dynasty.slug}
            crestSeed={resolveCrestSeed({ slug: dynasty.slug, crestSeed: dynasty.crestSeed })}
            nodes={nodes}
            edges={edges}
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
