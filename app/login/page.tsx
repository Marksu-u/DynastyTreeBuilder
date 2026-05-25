"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSignIn() {
    setPending(true);
    setError(null);

    const result = await signInWithGoogle();

    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else if (result?.url) {
      window.location.href = result.url;
    }
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

        <div className="space-y-3">
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            onClick={handleSignIn}
            disabled={pending}
            className="w-full rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            {pending ? "Redirecting…" : "Sign in with Google"}
          </button>
        </div>

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
