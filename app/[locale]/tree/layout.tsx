import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tree" });
  return {
    // Stays under ~60 chars once the layout template appends the site name.
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/tree" },
    openGraph: { url: "/tree" },
  };
}

export default async function TreeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Without this, reading messages here opts the whole segment into dynamic
  // rendering — /tree is a landing page that has to stay prerendered.
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tree");

  return (
    <>
      {/* The canvas is client-rendered, so without this the route has no
          heading and no outgoing link. `sr-only` is absolutely positioned and
          does not touch the canvas layout. */}
      <h1 className="sr-only">{t("srHeading")}</h1>
      <p className="sr-only">
        {t.rich("srBody", {
          about: (chunks) => <Link href="/">{chunks}</Link>,
        })}
      </p>
      {children}
    </>
  );
}
