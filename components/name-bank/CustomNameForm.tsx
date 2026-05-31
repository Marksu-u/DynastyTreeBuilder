"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { addCustomName } from "@/app/actions/name-bank";
import type { CharacterGender, NameStyle } from "@/types/canvas";
import type { CustomNameEntry } from "@/app/actions/name-bank";

const STYLES: { value: NameStyle; label: string }[] = [
  { value: "FANTASY", label: "Fantasy" },
  { value: "SCI_FI", label: "Sci-Fi" },
  { value: "HISTORICAL", label: "Historical" },
  { value: "MODERN", label: "Modern" },
  { value: "HORROR", label: "Horror" },
  { value: "OTHER", label: "Other" },
];

const GENDERS: { value: CharacterGender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "UNKNOWN", label: "Unknown" },
];

const INPUT =
  "w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500";

interface Props {
  onAdded: (entry: CustomNameEntry) => void;
}

export function CustomNameForm({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [style, setStyle] = useState<NameStyle>("FANTASY");
  const [gender, setGender] = useState<CharacterGender>("UNKNOWN");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const entry = await addCustomName({
        name: name.trim(),
        style,
        gender,
        note: note || undefined,
      });
      onAdded({
        id: entry.id,
        name: name.trim(),
        style,
        gender,
        note: note || null,
      });
      setName("");
      setNote("");
      setOpen(false);
    } catch {
      toast.error("Failed to save custom name");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-zinc-700 px-3 py-2 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400"
      >
        <Plus size={12} />
        Add custom name
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-600 bg-zinc-800/60 p-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-zinc-300">New name</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-zinc-500 hover:text-zinc-300"
        >
          <X size={12} />
        </button>
      </div>

      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
        className={INPUT}
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as NameStyle)}
          className={INPUT}
        >
          {STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as CharacterGender)}
          className={INPUT}
        >
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className={INPUT}
      />

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full rounded bg-zinc-100 py-1.5 text-xs font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
