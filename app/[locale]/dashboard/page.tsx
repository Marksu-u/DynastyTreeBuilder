import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { listDynasties } from "@/app/actions/dynasty";
import { CreateDynastyDialog } from "@/components/dashboard/CreateDynastyDialog";
import { DynastyCard } from "@/components/dashboard/DynastyCard";
import { GuestImportPrompt } from "@/components/dashboard/GuestImportPrompt";
import { signOut } from "@/app/actions/auth";
import { Network } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FramedHeader } from "@/components/shell/FramedHeader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("metaTitle") };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(getPathname({ href: "/login", locale: locale as Locale }));

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
            {t("signOut")}
          </button>
        </form>
      </FramedHeader>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <GuestImportPrompt />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("heading")}
            </h1>
            {dynasties.length > 0 && (
              <p className="mt-1 text-sm text-zinc-500">
                {t("count", { count: dynasties.length })}
              </p>
            )}
          </div>
          <CreateDynastyDialog />
        </div>

        {dynasties.length === 0 ? (
          <EmptyState
            icon={Network}
            title={t("empty.title")}
            description={t("empty.description")}
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
