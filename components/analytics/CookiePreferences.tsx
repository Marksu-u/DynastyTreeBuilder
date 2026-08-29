"use client";

import { useTranslations } from "next-intl";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/gtag";
import { useConsent } from "./ConsentProvider";

/**
 * The withdrawal control, embedded in the Cookie Policy.
 *
 * Consent that cannot be taken back is not consent, and burying the switch
 * would be the same failure by a slower route — so it sits in the document
 * that describes the cookies, one click from the footer of every page.
 *
 * The selected side is filled neutral rather than with the accent: the accent
 * marks the one action a screen wants you to take, and here there is no such
 * action — only which answer is currently in force.
 */
export function CookiePreferences() {
  const { choice, ready, grant, deny } = useConsent();
  const t = useTranslations("consent");

  if (!GA_MEASUREMENT_ID) return null;

  const status = !ready
    ? t("prefs.pending")
    : choice
      ? t(`prefs.${choice}`)
      : t("prefs.unanswered");

  return (
    <div className="mt-2 rounded-lg border border-zinc-700 bg-surface-2 p-4">
      <p aria-live="polite" className="text-zinc-300">
        {status}
      </p>

      <div className="mt-3 inline-flex overflow-hidden rounded-md border border-zinc-700 text-xs">
        <button
          type="button"
          onClick={deny}
          disabled={!ready}
          aria-pressed={choice === "denied"}
          className={
            choice === "denied"
              ? "bg-zinc-100 px-3 py-1.5 font-medium text-zinc-900"
              : "cursor-pointer px-3 py-1.5 text-zinc-400 hover:text-zinc-100"
          }
        >
          {t("decline")}
        </button>
        <button
          type="button"
          onClick={grant}
          disabled={!ready}
          aria-pressed={choice === "granted"}
          className={
            choice === "granted"
              ? "bg-zinc-100 px-3 py-1.5 font-medium text-zinc-900"
              : "cursor-pointer px-3 py-1.5 text-zinc-400 hover:text-zinc-100"
          }
        >
          {t("accept")}
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-500">{t("prefs.note")}</p>
    </div>
  );
}
