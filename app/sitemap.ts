import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { locales, defaultLocale, type Locale } from "@/i18n/routing";

/** Bump by hand when a page's copy changes. A build timestamp would lie. */
const LAST_MODIFIED = {
  home: new Date("2026-08-29"),
  tree: new Date("2026-08-29"),
};

const ROUTES = [
  { href: "/", lastModified: LAST_MODIFIED.home },
  { href: "/tree", lastModified: LAST_MODIFIED.tree },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const url = (locale: Locale, href: string) =>
    `${siteUrl}${getPathname({ href, locale })}`.replace(/\/$/, "") || siteUrl;

  // One entry per route, canonicalised to the default locale, with every locale
  // declared as a `languages` alternate. Listing the French URLs as their own
  // entries instead would compete with the English ones rather than pair them.
  //
  // No `priority` or `changeFrequency`: Google ignores both. Shared dynasties
  // are absent too — user content, served with `noindex`.
  return ROUTES.map(({ href, lastModified }) => ({
    url: url(defaultLocale, href),
    lastModified,
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [locale, url(locale, href)]),
      ),
    },
  }));
}
