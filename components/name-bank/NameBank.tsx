"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, X, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";
import { NAME_BANK } from "@/lib/name-bank";
import { NameCard } from "./NameCard";
import { CustomNameForm } from "./CustomNameForm";
import { getCustomNames, deleteCustomName } from "@/app/actions/name-bank";
import type { CharacterGender, NameStyle } from "@/types/canvas";
import type { CustomNameEntry } from "@/app/actions/name-bank";

const STYLE_OPTIONS: { value: NameStyle | ""; label: string }[] = [
  { value: "", label: "All styles" },
  { value: "FANTASY", label: "Fantasy" },
  { value: "SCI_FI", label: "Sci-Fi" },
  { value: "HISTORICAL", label: "Historical" },
  { value: "MODERN", label: "Modern" },
  { value: "HORROR", label: "Horror" },
  { value: "OTHER", label: "Other" },
];

const GENDER_OPTIONS: { value: CharacterGender | ""; label: string }[] = [
  { value: "", label: "All genders" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" },
];

const SELECT =
  "rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-500 w-full";

interface Props {
  usedNames: string[];
  onAddToCanvas?: (name: string) => void;
  isLoggedIn?: boolean;
}

export function NameBank({ usedNames, onAddToCanvas, isLoggedIn }: Props) {
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState<NameStyle | "">("");
  const [genderFilter, setGenderFilter] = useState<CharacterGender | "">("");
  const [customNames, setCustomNames] = useState<CustomNameEntry[]>([]);

  useEffect(() => {
    if (!isLoggedIn) return;
    getCustomNames().then(setCustomNames).catch(() => {});
  }, [isLoggedIn]);

  const usedSet = useMemo(
    () => new Set(usedNames.map((n) => n.toLowerCase())),
    [usedNames]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const all = [
      ...customNames.map((n) => ({ ...n, isCustom: true as const })),
      ...NAME_BANK.map((n) => ({ ...n, isCustom: false as const })),
    ];
    return all.filter((n) => {
      if (q && !n.name.toLowerCase().includes(q)) return false;
      if (styleFilter && n.style !== styleFilter) return false;
      if (genderFilter && n.gender !== genderFilter) return false;
      return true;
    });
  }, [search, styleFilter, genderFilter, customNames]);

  async function handleDelete(id: string) {
    setCustomNames((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteCustomName(id);
      toast.success("Custom name deleted");
    } catch {
      toast.error("Failed to delete name");
    }
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium text-zinc-200">Name Bank</span>
        <span className="text-xs text-zinc-500">{filtered.length}</span>
      </div>

      <div className="space-y-2 border-b border-zinc-800 p-3">
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search names…"
            className="w-full rounded border border-zinc-700 bg-zinc-800 py-1.5 pl-7 pr-7 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value as NameStyle | "")}
            className={SELECT}
          >
            {STYLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={genderFilter}
            onChange={(e) =>
              setGenderFilter(e.target.value as CharacterGender | "")
            }
            className={SELECT}
          >
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {isLoggedIn && (
          <div className="mb-3">
            <CustomNameForm
              onAdded={(entry) =>
                setCustomNames((prev) => [entry, ...prev])
              }
            />
            {customNames.length === 0 && (
              <EmptyState
                icon={Star}
                title="No custom names yet"
                description="Add a name above to save it to your personal bank."
              />
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-600">
            No names match your filters
          </p>
        ) : (
          filtered.map((n) => (
            <NameCard
              key={n.id}
              name={n.name}
              style={n.style}
              gender={n.gender}
              role={n.role}
              note={n.note}
              isUsed={usedSet.has(n.name.toLowerCase())}
              isCustom={n.isCustom}
              onAddToCanvas={
                onAddToCanvas ? () => onAddToCanvas(n.name) : undefined
              }
              onDelete={n.isCustom ? () => handleDelete(n.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
