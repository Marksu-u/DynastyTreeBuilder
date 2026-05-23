"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorCard } from "@/components/ui/ErrorCard";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            Dynasty Tree Builder
          </span>
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <ErrorCard error={error} reset={reset} />
      </main>
    </div>
  );
}
