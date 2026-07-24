import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listDynasties } from "@/app/actions/dynasty";
import { CreateDynastyDialog } from "@/components/dashboard/CreateDynastyDialog";
import { DynastyCard } from "@/components/dashboard/DynastyCard";
import { GuestImportPrompt } from "@/components/dashboard/GuestImportPrompt";
import { signOut } from "@/app/actions/auth";
import { Network } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Your Dynasties",
};

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
            <Link
              href="/account"
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              {user.email}
            </Link>
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
        <GuestImportPrompt />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Your Dynasties
            </h1>
            {dynasties.length > 0 && (
              <p className="mt-1 text-sm text-zinc-500">
                {dynasties.length === 1 ? "1 dynasty" : `${dynasties.length} dynasties`}
              </p>
            )}
          </div>
          <CreateDynastyDialog />
        </div>

        {dynasties.length === 0 ? (
          <EmptyState
            icon={Network}
            title="No dynasties yet"
            description="Create your first dynasty to start mapping your world."
            action={<CreateDynastyDialog />}
          />
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
