"use client";

import { useState } from "react";
import { signInWithMagicLink } from "@/app/actions/auth";

export default function LoginPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signInWithMagicLink(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSent(true);
    }

    setPending(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Dynasty Tree Builder
          </h1>
          <p className="text-sm text-zinc-400">
            Sign in to save your dynasties across sessions.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-300">
            Check your email — a magic link is on its way.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-zinc-500">
          No account needed to use the tool.{" "}
          <a href="/tree" className="underline hover:text-zinc-300">
            Try it as a guest →
          </a>
        </p>
      </div>
    </main>
  );
}
