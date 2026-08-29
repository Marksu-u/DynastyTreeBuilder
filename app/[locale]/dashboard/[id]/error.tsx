"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorCard } from "@/components/ui/ErrorCard";

export default function DynastyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 px-4">
        <span className="text-sm text-zinc-400">← Dynasties</span>
        <span className="text-zinc-700">/</span>
        <Skeleton className="h-4 w-32" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <ErrorCard error={error} reset={reset} />
      </main>
    </div>
  );
}
