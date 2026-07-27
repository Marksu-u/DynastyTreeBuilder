"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Trash2, Users } from "lucide-react";
import { deleteDynasty } from "@/app/actions/dynasty";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const SETTING_LABELS: Record<string, string> = {
  FANTASY: "Fantasy",
  SCI_FI: "Sci-Fi",
  HISTORICAL: "Historical",
  MODERN: "Modern",
  HORROR: "Horror",
  OTHER: "Other",
};

interface Props {
  dynasty: {
    id: string;
    name: string;
    setting: string;
    updatedAt: Date;
    _count: { characters: number };
  };
}

export function DynastyCard({ dynasty }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDynasty(dynasty.id);
      if (result.error) toast.error(result.error);
      else toast.success(`"${dynasty.name}" deleted`);
    });
  }

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
      <Link href={`/dashboard/${dynasty.id}`} className="block">
        <div className="mb-3 flex items-start justify-between">
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
            {SETTING_LABELS[dynasty.setting] ?? dynasty.setting}
          </span>
        </div>
        <h2 className="mb-1 truncate text-base font-semibold text-zinc-100">
          {dynasty.name}
        </h2>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Users className="h-3 w-3" />
          <span>
            {dynasty._count.characters}{" "}
            {dynasty._count.characters === 1 ? "character" : "characters"}
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Updated {new Date(dynasty.updatedAt).toLocaleDateString()}
        </p>
      </Link>

      <button
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        className="absolute right-3 top-3 cursor-pointer rounded p-1 text-zinc-700 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
        aria-label={`Delete ${dynasty.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${dynasty.name}"?`}
        description="This removes the dynasty and every character and relationship in it. This cannot be undone."
        confirmLabel="Delete dynasty"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
