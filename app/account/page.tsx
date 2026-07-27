import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog";
import { ECOSYSTEM_TOOLS } from "@/components/legal/ecosystem";
import { Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) redirect("/login");

  return (
    <div className="min-h-screen bg-background text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight text-zinc-100"
          >
            ← Your Dynasties
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
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>

        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-medium text-zinc-400">Signed in as</h2>
          <p className="mt-1 text-sm text-zinc-100">{user.email}</p>
        </section>

        <section className="mt-6 rounded-xl border border-red-900/60 bg-red-950/20 p-5">
          <h2 className="text-sm font-semibold text-red-300">Danger zone</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Deleting your account permanently erases everything tied to it: all
            your dynasties, characters, relationships, and custom options — and
            your sign-in identity itself. This cannot be undone.
          </p>
          <p className="mt-3 text-sm text-zinc-400">
            One account covers every Bag Of Holding Tools app, so this erases
            your data from all of them:
          </p>
          <ul className="mt-2 space-y-1">
            {ECOSYSTEM_TOOLS.map((tool) => (
              <li
                key={tool.name}
                className="flex items-center gap-2 text-sm text-zinc-300"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0 text-red-400" />
                {tool.name}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <DeleteAccountDialog email={user.email} />
          </div>
        </section>
      </main>
    </div>
  );
}
