"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/gtag";
import { useConsent } from "./ConsentProvider";

/**
 * The one-time analytics question.
 *
 * It used to render English and French at once, because the app had no notion
 * of a current locale and a guessed one would have left half the audience
 * clicking a button they could not read. Now that the locale is in the URL and
 * the whole page around this banner is already in one language, showing the
 * other one too would only be noise — the Loi Toubon is satisfied by the French
 * being reachable at /fr, not by stacking both in the overlay.
 *
 * Not part of the workspace slot map (design.md §9): it is a transient overlay
 * like a dialog, not chrome, and it is gone for good once answered — in
 * practice on the landing page, before a canvas is ever opened.
 *
 * Refusing is exactly as cheap as accepting: one click, same row, same size,
 * no second screen and no pre-ticked anything. That symmetry is the point of
 * the component, not a detail of it.
 */
export function ConsentBanner() {
  const { choice, ready, grant, deny } = useConsent();
  const t = useTranslations("consent");

  // Nothing to ask if analytics is not configured at all — a local checkout
  // without NEXT_PUBLIC_GA_ID never shows this.
  if (!GA_MEASUREMENT_ID) return null;
  // `ready` guards the flash: until localStorage is read, we do not know that a
  // returning visitor already answered.
  if (!ready || choice !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-label"
      aria-describedby="consent-body"
      className="consent-banner fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-sm sm:p-5"
    >
      <p
        id="consent-label"
        className="font-mono text-[11px] uppercase tracking-wider text-zinc-500"
      >
        {t("label")}
      </p>

      <p id="consent-body" className="mt-2 text-sm leading-relaxed text-zinc-400">
        {t("body")}{" "}
        <Link href="/cookies" className="underline hover:text-zinc-100">
          {t("policy")}
        </Link>
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={deny}
          className="cursor-pointer rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
        >
          {t("decline")}
        </button>
        <button
          type="button"
          onClick={grant}
          className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-zinc-950 transition-opacity hover:opacity-90"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
