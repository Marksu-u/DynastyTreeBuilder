"use client";

import { AlertTriangle } from "lucide-react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function ErrorCard({ error, reset }: Props) {
  const message =
    error.message && error.message !== "An unexpected error occurred"
      ? error.message
      : "An unexpected error occurred. Please try again.";

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <AlertTriangle size={40} className="text-destructive" />
      <div>
        <p className="text-sm font-medium text-zinc-300">Something went wrong</p>
        <p className="mt-1 text-xs text-zinc-500">{message}</p>
      </div>
      <button
        onClick={reset}
        className="mt-1 rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
      >
        Try again
      </button>
    </div>
  );
}
