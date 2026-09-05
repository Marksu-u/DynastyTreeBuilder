import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Footer } from "./Footer";
import { FramedHeader } from "@/components/shell/FramedHeader";

/**
 * Shell shared by the four legal documents. They differ only in their sections,
 * so the chrome — language switcher, heading, last-updated line, back link,
 * footer — lives here once and the pages pass nothing but their title.
 *
 * This used to be a client component holding both languages at once and
 * swapping them with a toggle, which meant every reader downloaded a document
 * they could not read and the URL could not name what was on screen. The locale
 * is in the URL now, so only one language is ever rendered, /fr/privacy is
 * linkable and indexable, and the Loi Toubon is satisfied by the French being
 * reachable rather than by shipping it alongside the English.
 */
export async function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string;
  /** Pre-formatted month and year, e.g. "August 2026" / "Août 2026". */
  updated: string;
  children: ReactNode;
}) {
  const t = await getTranslations("legalPages");

  return (
    <main className="min-h-screen bg-background">
      <FramedHeader maxWidth="max-w-2xl" />
      <div className="mx-auto max-w-2xl px-6 py-16 text-sm text-zinc-300">
        <div className="mb-6 flex items-center justify-between gap-4">
          <LanguageSwitcher />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-zinc-100">{title}</h1>
        <p className="mb-8 text-zinc-500">
          {t("updated", { date: updated })}
        </p>

        <section className="space-y-6">{children}</section>

        <div className="mt-12">
          <Link href="/" className="text-xs text-zinc-500 underline hover:text-zinc-300">
            {t("back")}
          </Link>
        </div>
      </div>

      <Footer currentTool="Dynasty Tree Builder" />
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

/**
 * Inline markup shared by the legal messages. The catalogs carry `<b>` and
 * `<code>` rather than raw HTML so a translator never has to copy Tailwind
 * classes, and the styling stays in one place when it changes.
 */
export const legalTags = {
  b: (chunks: ReactNode) => <strong className="text-zinc-300">{chunks}</strong>,
  code: (chunks: ReactNode) => <code className="text-zinc-300">{chunks}</code>,
  // Angle brackets around a placeholder name. They cannot live in the catalog:
  // next-intl parses message values as markup, so a literal "<" makes the whole
  // string fail to parse and render as its own key path.
  stream: (chunks: ReactNode) => <>&lt;{chunks}&gt;</>,
};

/**
 * A rich-text tag handler for one external link. The href lives beside the
 * sentence in the catalog, because some of them differ by language — the CNIL
 * publishes its cookie guidance at a different path in English and French.
 */
export function extLink(href: string) {
  // eslint-disable-next-line react/display-name -- a next-intl chunk renderer, not a component
  return (chunks: ReactNode) => (
    <a
      href={href}
      className="underline hover:text-zinc-100"
      target="_blank"
      rel="noopener noreferrer"
    >
      {chunks}
    </a>
  );
}

/**
 * A rich-text tag handler for a link to another page of this site. Uses the
 * locale-aware Link, so a reader at /fr/terms who follows "Charte de
 * Confidentialité" lands on /fr/privacy rather than the English document.
 */
export function intLink(href: string) {
  // eslint-disable-next-line react/display-name -- a next-intl chunk renderer, not a component
  return (chunks: ReactNode) => (
    <Link href={href} className="underline hover:text-zinc-100">
      {chunks}
    </Link>
  );
}

/**
 * A rich-text tag handler for a mailto link. The address is passed in from
 * lib/legal.ts and interpolated as the `{email}` value inside the tag, so it
 * never has to be written into the catalogs — one copy, not three.
 */
export function mailLink(address: string) {
  // eslint-disable-next-line react/display-name -- a next-intl chunk renderer, not a component
  return (chunks: ReactNode) => (
    <a href={`mailto:${address}`} className="underline hover:text-zinc-100">
      {chunks}
    </a>
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
