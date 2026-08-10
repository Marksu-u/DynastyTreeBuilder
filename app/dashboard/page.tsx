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
import { FramedHeader } from "@/components/shell/FramedHeader";

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
    <div className="min-h-screen bg-background text-zinc-100">
      <FramedHeader maxWidth="max-w-5xl">
        <Link
          href="/account"
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          {user.email}
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="cursor-pointer text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Sign out
          </button>
        </form>
      </FramedHeader>

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
