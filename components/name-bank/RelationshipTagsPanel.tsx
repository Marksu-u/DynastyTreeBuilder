"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  TAGS_BY_TONE,
  TONE_LABELS,
  TONE_ACCENT,
  TONE_BORDER,
  type TagDefinition,
  type TagTone,
} from "@/lib/relationship-tags";

export function RelationshipTagsPanel() {
  const tones: TagTone[] = ['positive', 'negative', 'complex', 'neutral'];

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium text-zinc-200">Relationship Tags</span>
        <span className="text-xs text-zinc-500">20 tags</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tones.map((tone) => (
          <ToneSection key={tone} tone={tone} tags={TAGS_BY_TONE[tone]} />
        ))}
      </div>
    </div>
  );
}

function ToneSection({ tone, tags }: { tone: TagTone; tags: TagDefinition[] }) {
  return (
    <div className="p-3">
      <p className={`mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wider ${TONE_ACCENT[tone]}`}>
        {TONE_LABELS[tone]}
      </p>
      <div className="space-y-2">
        {tags.map((def) => (
          <TagCard key={def.tag} definition={def} />
        ))}
      </div>
    </div>
  );
}

function TagCard({ definition }: { definition: TagDefinition }) {
  function handleCopy() {
    navigator.clipboard.writeText(definition.label);
    toast.success(`Copied: ${definition.label}`);
  }

  return (
    <div
      className={`rounded-lg border border-zinc-700/50 border-l-2 ${TONE_BORDER[definition.tone]} bg-zinc-800/40 p-3 space-y-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-100">{definition.label}</p>
        <button
          onClick={handleCopy}
          className="mt-0.5 shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-200"
          title={`Copy "${definition.label}"`}
        >
          <Copy size={12} />
        </button>
      </div>

      <p className="text-xs leading-relaxed text-zinc-500">
        {definition.description}
      </p>

      <div className="space-y-1 border-t border-zinc-700/40 pt-2">
        {definition.hooks.map((hook, i) => (
          <p key={i} className="text-[11px] italic text-zinc-600 leading-relaxed">
            {hook}
          </p>
        ))}
      </div>
    </div>
  );
}
