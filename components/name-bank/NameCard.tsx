"use client";

import { toast } from "sonner";
import { Copy, Plus, Star, Trash2 } from "lucide-react";
import type { CharacterGender, NameStyle } from "@/types/canvas";

// NameStyle (genre: Fantasy / Sci-Fi / …) is a closed enum, not in the catalog
const STYLE_LABELS: Record<NameStyle, string> = {
  FANTASY: "Fantasy",
  SCI_FI: "Sci-Fi",
  HISTORICAL: "Historical",
  MODERN: "Modern",
  HORROR: "Horror",
  OTHER: "Other",
};

// CharacterGender is a closed enum, not in the catalog
const GENDER_LABELS: Record<CharacterGender, string> = {
  MALE: "M",
  FEMALE: "F",
  NON_BINARY: "NB",
  UNKNOWN: "?",
};

interface Props {
  name: string;
  style: NameStyle;
  gender: CharacterGender;
  note?: string | null;
  isUsed?: boolean;
  isCustom?: boolean;
  onAddToCanvas?: () => void;
  onDelete?: () => void;
}

export function NameCard({
  name, style, gender, note, isUsed, isCustom, onAddToCanvas, onDelete,
}: Props) {
  function handleCopy() {
    navigator.clipboard.writeText(name);
    toast.success(`Copied: ${name}`);
  }

  return (
    <div
      className={[
        "group relative rounded-lg border px-3 py-2.5 transition-colors cursor-pointer select-none",
        isUsed
          ? "border-zinc-800 bg-zinc-900/40 opacity-50"
          : "border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800",
      ].join(" ")}
      onClick={handleCopy}
      title="Click to copy"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-zinc-100 truncate">{name}</span>
            {isCustom && (
              <Star size={10} className="shrink-0 text-amber-400 fill-amber-400" />
            )}
          </div>
          {note && (
            <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{note}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Badge>{STYLE_LABELS[style]}</Badge>
            <Badge>{GENDER_LABELS[gender]}</Badge>
            {isUsed && <Badge className="text-zinc-600">On canvas</Badge>}
          </div>
        </div>

        <div
          className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleCopy}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            title="Copy name"
          >
            <Copy size={12} />
          </button>
          {onAddToCanvas && !isUsed && (
            <button
              onClick={onAddToCanvas}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              title="Add to canvas"
            >
              <Plus size={12} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded p-1 text-zinc-400 hover:bg-red-900/40 hover:text-red-400"
              title="Delete custom name"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "rounded px-1.5 py-0.5 text-[10px] font-medium bg-zinc-700/60 text-zinc-400",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
