"use client";

import { useState } from "react";
import { Shuffle, Plus, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { NAME_BANK } from "@/lib/name-bank";
import type { RoleDefinition } from "@/lib/role-definitions";
import { resolveOption } from "@/lib/catalog";

interface Props {
  definition: RoleDefinition;
  onAddToCanvas?: (name: string, role: string) => void;
}

type Suggestion = { name: string; added: boolean };

function pickSuggestion(role: string): string {
  const matching = NAME_BANK.filter((n) => n.role === role);
  const pool = matching.length > 0 ? matching : NAME_BANK;
  return pool[Math.floor(Math.random() * pool.length)].name;
}

export function RoleCard({ definition, onAddToCanvas }: Props) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  function handleSuggest() {
    const name = pickSuggestion(definition.role);
    setSuggestion({ name, added: false });
    navigator.clipboard.writeText(name);
    toast.success(`Suggested: ${name}`, { description: `for ${definition.label}` });
  }

  function handleAddToCanvas() {
    if (!suggestion || !onAddToCanvas) return;
    onAddToCanvas(suggestion.name, definition.role);
    setSuggestion((s) => s && { ...s, added: true });
  }

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 p-3 space-y-2.5">
      <div>
        <p className="text-sm font-medium text-zinc-100">{definition.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
          {definition.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {definition.tags.map((tag) => (
          <span
            key={tag}
            className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-zinc-700/40 text-zinc-400"
          >
            {resolveOption('RELATIONSHIP_TAG', tag).label.toLowerCase()}
          </span>
        ))}
      </div>

      <div className="space-y-1 border-t border-zinc-700/40 pt-2">
        {definition.hooks.map((hook, i) => (
          <p key={i} className="text-[11px] italic text-zinc-600 leading-relaxed">
            {hook}
          </p>
        ))}
      </div>

      {suggestion ? (
        <div className="flex items-center gap-2 rounded-md border border-zinc-600/50 bg-zinc-700/30 px-2.5 py-1.5">
          <span className="flex-1 text-sm font-medium text-zinc-200 truncate">
            {suggestion.name}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(suggestion.name);
              toast.success(`Copied: ${suggestion.name}`);
            }}
            className="rounded p-0.5 text-zinc-400 hover:text-zinc-200"
            title="Copy name"
          >
            <Copy size={11} />
          </button>
          <button
            onClick={handleSuggest}
            className="rounded p-0.5 text-zinc-400 hover:text-zinc-200"
            title="Suggest another"
          >
            <RefreshCw size={11} />
          </button>
          {onAddToCanvas && (
            <button
              onClick={handleAddToCanvas}
              disabled={suggestion.added}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors disabled:opacity-40 bg-zinc-600 text-zinc-200 hover:bg-zinc-500 disabled:cursor-default"
              title="Add to canvas"
            >
              <Plus size={10} />
              {suggestion.added ? "Added" : "Add"}
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleSuggest}
          className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <Shuffle size={11} />
          Suggest a name for this slot
        </button>
      )}
    </div>
  );
}
