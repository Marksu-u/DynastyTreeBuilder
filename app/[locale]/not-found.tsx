import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/legal/Footer";
import { FramedHeader } from "@/components/shell/FramedHeader";

/**
 * The 404. Next serves it with a real 404 status, and it carries the way back
 * out rather than being a dead end. No `robots` export — Next already emits
 * `noindex` on this boundary, and declaring it twice duplicates the meta.
 *
 * `not-found.tsx` renders outside the [locale] params, so the locale comes from
 * the request rather than a param — next-intl resolves it from the rewritten
 * path the proxy produced.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound");
  return { title: t("metaTitle") };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <FramedHeader maxWidth="max-w-3xl" />

      <main className="flex flex-1 items-center px-6 py-20">
        <div className="mx-auto max-w-lg">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-600">
            {t("code")}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-100">
            {t("heading")}
          </h1>
          <p className="mt-4 leading-relaxed text-zinc-400">{t("body")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tree"
              className="rounded-md bg-zinc-100 px-6 py-2.5 text-center text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
            >
              {t("canvas")}
            </Link>
            <Link
              href="/"
              className="rounded-md border border-zinc-700 px-6 py-2.5 text-center text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            >
              {t("about")}
            </Link>
          </div>
        </div>
      </main>

      <Footer currentTool="Dynasty Tree Builder" />
    </div>
  );
}
