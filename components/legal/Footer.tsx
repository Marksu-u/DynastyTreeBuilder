import Link from "next/link";
import { ECOSYSTEM_TOOLS } from "./ecosystem";

const LABELS = {
  fr: {
    partOf: "fait partie de",
    tagline: "des outils gratuits, pour toujours.",
    moreTools: "Autres outils",
    legal: "Mentions Légales",
    privacy: "Confidentialité",
    terms: "CGU",
    cookies: "Cookies",
  },
  en: {
    partOf: "is part of",
    tagline: "free tools, forever.",
    moreTools: "More tools",
    legal: "Legal Notice",
    privacy: "Privacy",
    terms: "Terms",
    cookies: "Cookies",
  },
};

/**
 * The shared ecosystem footer. Every Bag Of Holding Tools app mounts this
 * (on marketing/legal pages, not full-screen app views) so the brand, legal
 * links, and sibling-tool list stay identical everywhere. See docs/ecosystem.md.
 */
export function Footer({
  currentTool,
  lang = "en",
}: {
  currentTool: string;
  lang?: "fr" | "en";
}) {
  const t = LABELS[lang];
  const otherTools = ECOSYSTEM_TOOLS.filter((tool) => tool.name !== currentTool);

  return (
    <footer className="border-t border-zinc-800 px-6 py-8 text-xs text-zinc-500">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-zinc-400">
            <span className="font-medium text-zinc-300">{currentTool}</span> {t.partOf}{" "}
            <span className="font-medium text-zinc-300">Bag Of Holding Tools</span> —{" "}
            {t.tagline}
          </p>
          <nav className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/legal" className="hover:text-zinc-300">
              {t.legal}
            </Link>
            <Link href="/privacy" className="hover:text-zinc-300">
              {t.privacy}
            </Link>
            <Link href="/terms" className="hover:text-zinc-300">
              {t.terms}
            </Link>
            <Link href="/cookies" className="hover:text-zinc-300">
              {t.cookies}
            </Link>
          </nav>
        </div>

        {otherTools.length > 0 && (
          <div>
            <p className="text-zinc-400">{t.moreTools}</p>
            <nav className="mt-2 flex flex-col gap-1">
              {otherTools.map((tool) => (
                <a key={tool.name} href={tool.url} className="hover:text-zinc-300">
                  {tool.name}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </footer>
  );
}
