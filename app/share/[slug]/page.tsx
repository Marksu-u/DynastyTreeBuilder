import { notFound } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { prisma } from "@/lib/prisma";
import { ShareCanvas } from "@/components/canvas/ShareCanvas";
import "@xyflow/react/dist/style.css";
import type { CharacterNodeType, RelationshipEdgeType } from "@/store/canvas";
import type {
  CharacterRole,
  CharacterStyle,
  CharacterGender,
  RelationshipType,
  RelationshipTag,
} from "@/types/canvas";

const SETTING_LABELS: Record<string, string> = {
  FANTASY: "Fantasy",
  SCI_FI: "Sci-Fi",
  HISTORICAL: "Historical",
  MODERN: "Modern",
  HORROR: "Horror",
  OTHER: "Other",
};

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
      role: char.role as CharacterRole,
      style: char.style as CharacterStyle,
      gender: char.gender as CharacterGender,
      note: char.note ?? undefined,
      isFounder: char.isFounder,
      isLost: char.isLost,
      generation: char.generation,
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
    <ReactFlowProvider>
      <div className="flex h-screen flex-col bg-zinc-950">
        <header className="flex h-12 shrink-0 items-center gap-4 border-b border-zinc-800 px-4">
          <span className="text-sm font-medium text-zinc-200">{dynasty.name}</span>
          <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {SETTING_LABELS[dynasty.setting] ?? dynasty.setting}
          </span>
        </header>
        <div className="flex-1 overflow-hidden">
          <ShareCanvas
            dynastyName={dynasty.name}
            nodes={nodes}
            edges={edges}
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
