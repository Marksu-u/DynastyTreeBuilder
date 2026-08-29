import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { ConsentProvider } from "@/components/analytics/ConsentProvider";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { SOURCE_REPO_URL } from "@/components/legal/ecosystem";
import { locales, routing, LOCALE_TAGS, type Locale } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Pre-renders one static tree per locale instead of rendering on demand.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("name"),
      template: `%s · ${t("name")}`,
    },
    description: t("description"),
    applicationName: t("name"),
    // Preview directives only. A top-level `index: true` is the default anyway,
    // and would contradict the `noindex` Next emits on the not-found boundary.
    robots: {
      googleBot: {
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    // No `url`: openGraph is merged, not replaced, so every page would claim the
    // homepage as its share target. Each page sets its own.
    openGraph: {
      siteName: t("name"),
      type: "website",
      locale: LOCALE_TAGS[locale as Locale] ?? LOCALE_TAGS.en,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: t("ogAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@marksu_u",
    },
    verification: {
      google: "HuVWPAQh_dt5pplSZkLyCAADfgKGkk720h9DqhFVNTQ",
    },
  };
}

export const viewport: Viewport = {
  // Mirrors --background in globals.css. Dark only (charter §6), so one value.
  themeColor: "#0B0E1A",
  colorScheme: "dark",
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  // A bogus segment such as /de/tree reaches here as a locale. Without this
  // guard it would render the default locale under a wrong URL, which search
  // engines would then index as a duplicate.
  if (!hasLocale(routing.locales, locale)) notFound();

  // Required for static rendering: tells next-intl which locale this tree is
  // being generated for, since there is no request to infer it from.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "site" });

  /**
   * Site-level identity, mounted once for every route. The landing page
   * describes the product (SoftwareApplication) and references these `@id`s.
   */
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: t("name"),
        alternateName: `${t("name")} — Bag Of Holding Tools`,
        description: t("jsonLdDescription"),
        inLanguage: locale,
        publisher: { "@id": `${siteUrl}/#publisher` },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#publisher`,
        name: "Bag Of Holding Tools",
        url: siteUrl,
        description: t("orgDescription"),
        sameAs: ["https://x.com/marksu_u", SOURCE_REPO_URL],
      },
    ],
  };

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <NextIntlClientProvider>
          {/* Wraps children so the Cookie Policy page can read and change the
              answer from inside the document that explains it. */}
          <ConsentProvider>
            {children}
            <ConsentBanner />
            <GoogleAnalytics />
          </ConsentProvider>
          <Toaster theme="dark" position="bottom-right" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
