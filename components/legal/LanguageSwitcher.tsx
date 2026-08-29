"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, locales, type Locale } from "@/i18n/routing";

/**
 * Language switcher.
 *
 * `usePathname` from i18n/navigation returns the path WITHOUT the locale
 * prefix, so replacing it with a new locale keeps the reader on the same
 * document instead of dropping them back on the landing page.
 *
 * `replace` rather than `push`: choosing a language is a correction, not a step
 * in a journey, and it should not take two Backs to leave the page.
 */
export function LanguageSwitcher() {
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("language");

  return (
    <div
      className="inline-flex overflow-hidden rounded-md border border-zinc-700 text-xs"
      role="group"
      aria-label={t("label")}
    >
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            aria-label={LOCALE_LABELS[locale as Locale]}
            aria-current={active ? "true" : undefined}
            onClick={() => router.replace(pathname, { locale })}
            className={
              active
                ? "bg-[var(--accent)] px-3 py-1 font-medium text-zinc-950"
                : "cursor-pointer px-3 py-1 text-zinc-400 hover:text-zinc-100"
            }
          >
            {LOCALE_LABELS[locale as Locale]}
          </button>
        );
      })}
    </div>
  );
}
