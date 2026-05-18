import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DynastyCard } from "@/components/dashboard/DynastyCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      dynasties: {
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { characters: true } } },
      },
    },
  });
  if (!dbUser) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-100">Your Dynasties</h1>
          <Link
            href="/dashboard/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            New Dynasty
          </Link>
        </div>

        {dbUser.dynasties.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 p-12 text-center">
            <p className="text-lg font-medium text-zinc-400">No dynasties yet</p>
            <p className="mt-1 text-sm text-zinc-600">
              Create your first dynasty to get started
            </p>
            <Link
              href="/dashboard/new"
              className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Create Dynasty
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dbUser.dynasties.map((dynasty) => (
              <DynastyCard
                key={dynasty.id}
                dynasty={dynasty}
                characterCount={dynasty._count.characters}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
