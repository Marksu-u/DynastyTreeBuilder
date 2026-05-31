"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { CatalogKind, CatalogOption } from "@/lib/catalog";
import { useCatalog } from "@/components/canvas/CatalogProvider";
import { updateCustomOption, deleteCustomOption } from "@/app/actions/custom-options";

// ─── Kind display metadata ─────────────────────────────────────────────────────

const KIND_SECTIONS: { kind: CatalogKind; label: string }[] = [
  { kind: "CHARACTER_STYLE",   label: "Character Styles" },
  { kind: "RELATIONSHIP_TYPE", label: "Relationship Types" },
];

// ─── Main panel ───────────────────────────────────────────────────────────────

export function CustomOptionsPanel() {
  const { customs } = useCatalog();
  const totalCount = Object.values(customs).reduce((n, arr) => n + arr.length, 0);

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium text-zinc-200">Custom Options</span>
        <span className="text-xs text-zinc-500">{totalCount}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {totalCount === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-zinc-600 leading-relaxed">
            No custom options yet.
            <br />
            Use the&nbsp;<span className="text-zinc-500">+</span>&nbsp;button in the
            character or relationship editors to create your own styles and types.
          </div>
        ) : (
          KIND_SECTIONS.map(({ kind, label }) =>
            customs[kind].length > 0 ? (
              <KindSection key={kind} kind={kind} label={label} options={customs[kind]} />
            ) : null
          )
        )}
      </div>
    </div>
  );
}

// ─── Section per kind ─────────────────────────────────────────────────────────

function KindSection({
  kind,
  label,
  options,
}: {
  kind: CatalogKind;
  label: string;
  options: CatalogOption[];
}) {
  return (
    <div className="p-3">
      <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <OptionRow key={opt.value} kind={kind} option={opt} />
        ))}
      </div>
    </div>
  );
}

// ─── Individual row: view / inline-edit ──────────────────────────────────────

function OptionRow({ kind, option }: { kind: CatalogKind; option: CatalogOption }) {
  const { removeCustom, addCustom } = useCatalog();
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(option.label);
  const [editColor, setEditColor] = useState(option.color ?? "#6b7280");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!option.id) return toast.error("Missing option ID — cannot update.");
    setSaving(true);
    try {
      await updateCustomOption(option.id, {
        label: editLabel.trim() || option.label,
        color: editColor,
      });
      removeCustom(kind, option.value);
      addCustom(kind, { ...option, label: editLabel.trim() || option.label, color: editColor });
      setEditing(false);
      toast.success("Option updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!option.id) return toast.error("Missing option ID — cannot delete.");
    setDeleting(true);
    try {
      await deleteCustomOption(option.id);
      removeCustom(kind, option.value);
      toast.success(`"${option.label}" removed`);
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-zinc-600 bg-zinc-800/60 p-2.5 space-y-2">
        <input
          autoFocus
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={editColor}
            onChange={(e) => setEditColor(e.target.value)}
            className="h-7 w-10 cursor-pointer rounded border border-zinc-700 bg-zinc-800 p-0.5"
          />
          <div
            className="flex items-center rounded px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: editColor + "33",
              borderColor: editColor + "66",
              border: "1px solid",
              color: editColor,
            }}
          >
            Preview
          </div>
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => { setEditing(false); setEditLabel(option.label); setEditColor(option.color ?? "#6b7280"); }}
              className="rounded p-1 text-zinc-500 hover:text-zinc-300"
            >
              <X size={12} />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
            >
              <Check size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-3 py-2">
      <div
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: option.color ?? "#6b7280" }}
      />
      <span className="flex-1 truncate text-xs font-medium text-zinc-200">
        {option.label}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => { setEditLabel(option.label); setEditing(true); }}
          className="rounded p-1 text-zinc-500 hover:text-zinc-300"
          title="Edit"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded p-1 text-zinc-500 hover:text-red-400 disabled:opacity-40"
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
