"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import type { CatalogKind } from "@/lib/catalog";
import { DEFAULT_CATALOG } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { addCustomOption } from "@/app/actions/custom-options";

// ─── Kind labels shown in the creation dialog ─────────────────────────────────

const KIND_LABELS: Record<CatalogKind, string> = {
  CHARACTER_ROLE: "role",
  CHARACTER_STYLE: "style",
  RELATIONSHIP_TYPE: "relationship type",
  RELATIONSHIP_TAG: "tag",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  kind: CatalogKind;
  value: string;
  onChange: (value: string) => void;
  /** Pass false to hide the "+ Add custom…" button (e.g. guest mode or non-tag fields) */
  canCreate?: boolean;
  className?: string;
}

/**
 * A `<select>` replacement that merges default catalog options with the user's
 * custom options. When `canCreate` is true, a "+" button opens a mini dialog
 * where the DM can define a new custom option inline.
 */
export function CatalogSelect({
  kind,
  value,
  onChange,
  canCreate = false,
  className,
}: Props) {
  const { customs, getMerged, addCustom } = useCatalog();

  const defaults = DEFAULT_CATALOG[kind];
  const customOpts = customs[kind];
  const merged = getMerged(kind);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#6b7280");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      const result = await addCustomOption({
        kind,
        label: label.trim(),
        color,
        description: description.trim() || undefined,
      });

      const newOpt = {
        value: result.value,
        label: result.label,
        color,
        description: description.trim() || undefined,
        isCustom: true as const,
      };
      addCustom(kind, newOpt);
      onChange(result.value);

      setLabel("");
      setDescription("");
      setColor("#6b7280");
      setDialogOpen(false);
      toast.success(`Custom ${KIND_LABELS[kind]} "${result.label}" created`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create custom option";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        {/* Built-in defaults */}
        {customOpts.length > 0 ? (
          <>
            <optgroup label="Built-in">
              {defaults.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Your custom">
              {customOpts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          </>
        ) : (
          merged.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))
        )}
      </select>

      {canCreate && (
        <>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex shrink-0 items-center rounded-md border border-zinc-700 bg-zinc-800 px-2 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            title={`Add custom ${KIND_LABELS[kind]}`}
          >
            <Plus size={13} />
          </button>

          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title className="text-sm font-semibold text-zinc-100">
                    New custom {KIND_LABELS[kind]}
                  </Dialog.Title>
                  <Dialog.Close className="rounded p-1 text-zinc-500 hover:text-zinc-200">
                    <X size={14} />
                  </Dialog.Close>
                </div>

                <form onSubmit={handleCreate} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">
                      Label *
                    </label>
                    <input
                      autoFocus
                      required
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder={`e.g. Spymaster`}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-zinc-400">
                        Accent color
                      </label>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-9 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 p-0.5"
                      />
                    </div>
                    <div
                      className="mt-4 flex h-9 w-20 items-center justify-center rounded border px-2 text-[10px] font-medium"
                      style={{
                        backgroundColor: color + "33",
                        borderColor: color + "66",
                        color,
                      }}
                    >
                      Preview
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">
                      Description (optional)
                    </label>
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="One-line tooltip…"
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDialogOpen(false)}
                      className="flex-1 rounded-md border border-zinc-700 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !label.trim()}
                      className="flex-1 rounded-md bg-zinc-100 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
                    >
                      {saving ? "Creating…" : "Create"}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </>
      )}
    </div>
  );
}
