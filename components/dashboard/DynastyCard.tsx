"use client";

import Link from "next/link";
import { deleteDynasty } from "@/app/actions/dynasty";

const SETTING_LABELS: Record<string, string> = {
  FANTASY: "Fantasy",
  SCI_FI: "Sci-Fi",
  HISTORICAL: "Historical",
  MODERN: "Modern",
  HORROR: "Horror",
  OTHER: "Other",
};

type Props = {
  dynasty: {
    id: string;
    name: string;
    setting: string;
    updatedAt: Date;
  };
  characterCount: number;
};

export function DynastyCard({ dynasty, characterCount }: Props) {
  return (
    <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold leading-tight text-zinc-100">
          {dynasty.name}
        </h2>
        <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
          {SETTING_LABELS[dynasty.setting] ?? dynasty.setting}
        </span>
      </div>
      <p className="text-sm text-zinc-500">
        {characterCount} {characterCount === 1 ? "character" : "characters"}
      </p>
      <p className="mt-0.5 text-xs text-zinc-600">
        Updated {new Date(dynasty.updatedAt).toLocaleDateString()}
      </p>
      <div className="mt-4 flex gap-2">
        <Link
          href={`/dashboard/${dynasty.id}`}
          className="flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-indigo-500"
        >
          Open
        </Link>
        <form action={deleteDynasty.bind(null, dynasty.id)}>
          <button
            type="submit"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:border-red-800 hover:text-red-400"
            onClick={(e) => {
              if (!confirm(`Delete "${dynasty.name}"? This cannot be undone.`)) {
                e.preventDefault();
              }
            }}
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
