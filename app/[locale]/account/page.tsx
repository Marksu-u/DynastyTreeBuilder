import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { getPathname } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { listDynasties } from "@/app/actions/dynasty";
import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog";
import { ExportEverythingButton } from "@/components/account/ExportEverythingButton";
import { FramedHeader } from "@/components/shell/FramedHeader";
import { ECOSYSTEM_TOOLS } from "@/components/legal/ecosystem";
import { Trash2 } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: true },
  };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // next/navigation's redirect returns `never`, which narrows `user` below;
  // getPathname supplies the locale prefix so a signed-out French visitor lands
  // on /fr/login rather than being dropped into English.
  if (!user || !user.email) {
    redirect(getPathname({ href: "/login", locale: locale as Locale }));
  }

  const dynastyCount = (await listDynasties()).length;

  return (
    <div className="min-h-screen bg-background text-zinc-100">
      <FramedHeader
        toolName={t("back")}
        href="/dashboard"
        maxWidth="max-w-xl"
      >
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="cursor-pointer text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {t("signOut")}
          </button>
        </form>
      </FramedHeader>

      {/* max-w-xl is 576px — the account column width fixed in design.md §9.
          Narrower than the dashboard on purpose: this screen is a short list of
          facts and one irreversible action, not a workspace. */}
      <main className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-2xl font-medium tracking-tight">{t("heading")}</h1>

        {/* The facts, as rows: what we hold, how much of it, and the way out.
            "Export everything" sits here rather than on the dashboard because
            it is an account-level right, not a per-dynasty feature. */}
        <section className="mt-6 divide-y divide-zinc-800 rounded-xl border border-zinc-700 bg-surface-1 px-4">
          <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
            <span className="text-zinc-400">{t("email")}</span>
            <span className="truncate text-zinc-100">{user.email}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
            <span className="text-zinc-400">{t("saved")}</span>
            {/* tabular-nums per design.md §5 — every comparable number is lined. */}
            <span className="font-mono tabular-nums text-zinc-100">
              {dynastyCount}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
            <span className="text-zinc-400">{t("exportAll")}</span>
            <ExportEverythingButton />
          </div>
        </section>

        {/* Semantics are a rule, never a fill (design.md §4): the destructive
            weight is carried by the 2px left rule and the heading, on the same
            neutral surface as every other panel. */}
        <section className="mt-6 rounded-xl border border-zinc-800 border-l-2 border-l-destructive bg-surface-2 p-5">
          <h2 className="text-sm font-semibold text-destructive">{t("danger.heading")}</h2>
          <p className="mt-2 text-sm text-zinc-400">{t("danger.body")}</p>
          <p className="mt-3 text-sm text-zinc-400">{t("danger.ecosystem")}</p>
          <ul className="mt-2 space-y-1">
            {ECOSYSTEM_TOOLS.map((tool) => (
              <li
                key={tool.name}
                className="flex items-center gap-2 text-sm text-zinc-300"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0 text-destructive" />
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
