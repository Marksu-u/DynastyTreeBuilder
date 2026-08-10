"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createDynasty } from "@/app/actions/dynasty";

const SETTINGS = [
  { value: "FANTASY", label: "Fantasy" },
  { value: "SCI_FI", label: "Sci-Fi" },
  { value: "HISTORICAL", label: "Historical" },
  { value: "MODERN", label: "Modern" },
  { value: "HORROR", label: "Horror" },
  { value: "OTHER", label: "Other" },
] as const;

const INPUT =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm";

export default function NewDynastyPage() {
  const [state, action, isPending] = useActionState(createDynasty, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-zinc-100">New Dynasty</h1>
        <form action={action} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              Dynasty name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="House Varek…"
              className={INPUT}
            />
          </div>
          <div>
            <label
              htmlFor="setting"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              Setting
            </label>
            <select
              id="setting"
              name="setting"
              defaultValue="FANTASY"
              className={INPUT}
            >
              {SETTINGS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create Dynasty"}
            </button>
            <Link
              href="/dashboard"
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
