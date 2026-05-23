"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <ErrorCard error={error} reset={reset} />
    </div>
  );
}
