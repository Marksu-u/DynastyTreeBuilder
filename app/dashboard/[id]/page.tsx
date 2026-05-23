import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ReactFlowProvider } from "@xyflow/react";
import Link from "next/link";
import { DynastyCanvas } from "@/components/canvas/DynastyCanvas";
import { DynastySettingsDialog } from "@/components/dashboard/DynastySettingsDialog";
import "@xyflow/react/dist/style.css";
import type { CharacterNodeType, RelationshipEdgeType } from "@/store/canvas";
import type {
  CharacterRole,
  CharacterStyle,
  CharacterGender,
  RelationshipType,
  RelationshipTag,
} from "@/types/canvas";

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
      role: char.role as CharacterRole,
      style: char.style as CharacterStyle,
      gender: char.gender as CharacterGender,
      note: char.note ?? undefined,
      isFounder: char.isFounder,
      isLost: char.isLost,
    },
  }));

  const edges: RelationshipEdgeType[] = dynasty.relationships.map((rel) => ({
    id: rel.id,
    type: "relationship" as const,
    source: rel.fromId,
    target: rel.toId,
    data: {
      type: rel.type as RelationshipType,
      tag: (rel.tag as RelationshipTag) ?? undefined,
      hook: rel.hook ?? undefined,
      isMutual: rel.isMutual,
    },
  }));

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 px-4">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Dynasties
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm font-medium text-zinc-200">{dynasty.name}</span>
        <div className="ml-auto">
          <DynastySettingsDialog
            dynastyId={dynasty.id}
            initialName={dynasty.name}
            initialSetting={dynasty.setting}
            initialIsPublic={dynasty.isPublic}
          />
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <ReactFlowProvider>
          <DynastyCanvas
            dynastyId={dynasty.id}
            dynastyName={dynasty.name}
            initialNodes={nodes}
            initialEdges={edges}
            userId={dbUser.id}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
