import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
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
  const dynasty = await prisma.dynasty.findFirst({
    where: { id },
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) redirect("/login");

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
      initialSetting={dynasty.setting}
      initialIsPublic={dynasty.isPublic}
      initialNodes={nodes}
      initialEdges={edges}
      userId={dbUser.id}
    />
  );
}
