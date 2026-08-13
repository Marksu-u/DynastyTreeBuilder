import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { DynastyPageClient } from "@/components/canvas/DynastyPageClient";
import type { CharacterNodeType, LegacyEdgeType } from "@/store/canvas";
import type {
  CharacterFlag,
  CharacterGender,
  LegacyRelationshipType,
} from "@/types/canvas";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // Owner-scoped, like the page's own query below. Without the ownerId chain
  // this read returns any dynasty's name to any signed-in visitor who has its
  // id, while the page body itself correctly 404s — a title is still a leak.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Dynasty Canvas" };

  const dynasty = await prisma.dynasty.findFirst({
    where: { id, owner: { supabaseId: user.id } },
    select: { name: true },
  });
  return {
    title: dynasty?.name ?? "Dynasty Canvas",
  };
}

export default async function DynastyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // getAuthUser rather than an inline session + user lookup: it is the one place
  // that knows a database failure must not redirect (see lib/auth.ts), and this
  // page previously carried its own copy of the loop.
  const dbUser = await getAuthUser();

  const dynasty = await prisma.dynasty.findFirst({
    where: { id, ownerId: dbUser.id },
    include: { characters: true, relationships: true },
  });
  if (!dynasty) notFound();

  const nodes: CharacterNodeType[] = dynasty.characters.map((char) => ({
    id: char.id,
    type: "character" as const,
    position: { x: char.posX, y: char.posY },
    data: {
      name: char.name,
      alias: char.alias ?? undefined,
      flags: (char as any).flags as CharacterFlag[],
      style: char.style,
      gender: char.gender as CharacterGender,
      note: char.note ?? undefined,
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
    <DynastyPageClient
      dynastyId={dynasty.id}
      dynastyName={dynasty.name}
      dynastySlug={dynasty.slug}
      crestSeed={dynasty.crestSeed}
      initialSetting={dynasty.setting}
      initialIsPublic={dynasty.isPublic}
      initialNodes={nodes}
      initialEdges={edges}
      userId={dbUser.id}
    />
  );
}
