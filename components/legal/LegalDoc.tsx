"use client";

import Link from "next/link";
import { Children, Fragment, isValidElement, useEffect, useState, type ReactNode } from "react";
import { Footer } from "./Footer";

/**
 * A multi-child fragment authored in one component and rendered through a prop
 * in another loses its "static children" flag, so React re-validates its
 * children as a keyless list. Unwrap the fragment and key its children.
 */
function keyed(node: ReactNode): ReactNode {
  if (isValidElement(node) && node.type === Fragment) {
    return Children.toArray((node.props as { children?: ReactNode }).children);
  }
  return node;
}

type Lang = "fr" | "en";

const LABELS = {
  updated: { fr: "Dernière mise à jour", en: "Last updated" },
  back: { fr: "← Retour à Dynasty Tree Builder", en: "← Back to Dynasty Tree Builder" },
};

export function LegalDoc({
  titleFr,
  titleEn,
  updated,
  fr,
  en,
}: {
  titleFr: string;
  titleEn: string;
  updated: string;
  fr: ReactNode;
  en: ReactNode;
}) {
  const [lang, setLang] = useState<Lang>("fr");

  // Sync the displayed language to the visitor's browser locale on mount.
  // French is the canonical version and the SSR default (so server and first
  // client render agree); we switch to English afterwards for non-FR locales.
  // This reads the platform `navigator` API — a sanctioned effect use.
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.language?.toLowerCase().startsWith("fr")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to the platform navigator locale
      setLang("en");
    }
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-zinc-300">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="inline-flex overflow-hidden rounded-md border border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => setLang("fr")}
              aria-pressed={lang === "fr"}
              className={
                lang === "fr"
                  ? "bg-[var(--accent)] px-3 py-1 font-medium text-zinc-950"
                  : "px-3 py-1 text-zinc-400 hover:text-zinc-100"
              }
            >
              Français
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={
                lang === "en"
                  ? "bg-[var(--accent)] px-3 py-1 font-medium text-zinc-950"
                  : "px-3 py-1 text-zinc-400 hover:text-zinc-100"
              }
            >
              English
            </button>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-zinc-100">
          {lang === "fr" ? titleFr : titleEn}
        </h1>
        <p className="mb-8 text-zinc-500">
          {LABELS.updated[lang]}: {updated}
        </p>

        <section className="space-y-6">{keyed(lang === "fr" ? fr : en)}</section>

        <div className="mt-12">
          <Link href="/" className="text-xs text-zinc-500 underline hover:text-zinc-300">
            {LABELS.back[lang]}
          </Link>
        </div>
      </div>

      <Footer currentTool="Dynasty Tree Builder" lang={lang} />
    </main>
  );
}

/** A titled legal section: heading + body. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 font-semibold text-zinc-100">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/** Bulleted list styled for legal copy. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** Mailto link with consistent styling. */
export function Mail({ address }: { address: string }) {
  return (
    <a href={`mailto:${address}`} className="underline hover:text-zinc-100">
      {address}
    </a>
  );
}
