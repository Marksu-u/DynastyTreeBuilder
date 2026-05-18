import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listDynasties } from "@/app/actions/dynasty";
import { CreateDynastyDialog } from "@/components/dashboard/CreateDynastyDialog";
import { DynastyCard } from "@/components/dashboard/DynastyCard";
import { signOut } from "@/app/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dynasties = await listDynasties();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-zinc-100"
          >
            Dynasty Tree Builder
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Your Dynasties
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {dynasties.length === 0
                ? "No dynasties yet — create your first one."
                : `${dynasties.length} ${dynasties.length === 1 ? "dynasty" : "dynasties"}`}
            </p>
          </div>
          <CreateDynastyDialog />
        </div>

        {dynasties.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-800">
            <p className="text-sm text-zinc-600">
              Click{" "}
              <span className="text-zinc-400">New Dynasty</span> to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dynasties.map((d) => (
              <DynastyCard key={d.id} dynasty={d} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
