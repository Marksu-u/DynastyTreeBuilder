"use client";

interface Props {
  error: Error;
  reset: () => void;
}

export default function ShareError({ reset }: Props) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-400">
      <p className="text-sm">This dynasty could not be loaded.</p>
      <button
        onClick={reset}
        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs hover:border-zinc-500 hover:text-zinc-200"
      >
        Try again
      </button>
    </div>
  );
}
