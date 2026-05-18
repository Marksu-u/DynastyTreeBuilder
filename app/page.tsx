import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <div className="max-w-lg space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
          Dynasty Tree Builder
        </h1>
        <p className="text-lg leading-relaxed text-zinc-400">
          Map the webs of power, blood, and betrayal behind every dynasty.
          Build your family tree, annotate relationships, and keep track of
          every faction — from founders to fallen heirs.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="w-full rounded-md bg-zinc-100 px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white sm:w-auto"
          >
            Open Dashboard
          </Link>
          <Link
            href="/tree"
            className="w-full rounded-md border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 sm:w-auto"
          >
            Try as Guest
          </Link>
        </div>

        <p className="text-xs text-zinc-600">
          Guest mode saves locally — sign in to persist across devices.
        </p>
      </div>
    </main>
  );
}
