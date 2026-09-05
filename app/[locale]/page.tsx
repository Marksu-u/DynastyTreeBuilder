import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/legal/Footer";
import { FramedHeader } from "@/components/shell/FramedHeader";
import { SOURCE_REPO_URL } from "@/components/legal/ecosystem";
import { TreeScrollStager } from "@/components/landing/TreeScrollStager";
import { renderLandingTree } from "@/lib/landing-tree";
import { buildOgGraph } from "@/lib/og-tree";
import { landingDynasty } from "@/lib/seed/landing-dynasty";
import { Mark } from "@/components/ui/Mark";

type Copy = { title: string; body: string };
type Faq = { q: string; a: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: { canonical: "/" },
    openGraph: { url: "/" },
  };
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * The hero tree: a house composed for this panel, run through the same layout
 * engine the product uses, rendered to SVG on the server — no React Flow on the
 * one page that has to win Core Web Vitals.
 */
function heroTree() {
  const { characters, relationships } = landingDynasty();
  const { nodes, edges, founderIds } = buildOgGraph(characters, relationships);
  return renderLandingTree(nodes, edges, founderIds);
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tree = heroTree();

  const beats = t.raw("beats") as Copy[];
  const features = t.raw("features.items") as Copy[];
  const useCases = t.raw("useCases.items") as Copy[];
  const faq = t.raw("faq.items") as Faq[];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: t("faq.jsonLdName"),
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#app`,
    name: "Dynasty Tree Builder",
    applicationCategory: "DesignApplication",
    applicationSubCategory: t("jsonLd.subCategory"),
    operatingSystem: "Web browser",
    browserRequirements: "Requires JavaScript",
    url: siteUrl,
    inLanguage: locale,
    description: t("jsonLd.description"),
    image: `${siteUrl}/opengraph-image`,
    screenshot: `${siteUrl}/opengraph-image`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    featureList: features.map((feature) => feature.title),
    isAccessibleForFree: true,
    // Ties this page to the public repo as one entity, so a crawler that meets
    // either surface can resolve the other instead of guessing what the tool is.
    sameAs: [SOURCE_REPO_URL],
    codeRepository: SOURCE_REPO_URL,
    license: "https://opensource.org/licenses/MIT",
    // References, not copies — both nodes are declared in the root layout.
    publisher: { "@id": `${siteUrl}/#publisher` },
    isPartOf: { "@id": `${siteUrl}/#website` },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([faqJsonLd, softwareJsonLd]),
        }}
      />
      <TreeScrollStager />

      {/* Framed screen, so it carries the shared 57px header — see design.md §9.
          The column matches the hero's max-w-6xl below it. */}
      <FramedHeader maxWidth="max-w-6xl">
        <a
          href="#what-it-does"
          className="hidden text-xs text-zinc-500 transition-colors hover:text-zinc-300 sm:inline"
        >
          {t("nav.how")}
        </a>
        <a
          href="#faq"
          className="hidden text-xs text-zinc-500 transition-colors hover:text-zinc-300 sm:inline"
        >
          {t("nav.faq")}
        </a>
        <Link
          href="/login"
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          {t("nav.signIn")}
        </Link>
      </FramedHeader>

      <main className="flex-1">
        {/* Act one: the tree is sticky behind three beats of copy, growing a
            generation at a time. On mobile it sits still above the copy. */}
        <section aria-labelledby="hero" className="relative px-6">
          {/* Grid rather than flex so the tree can occupy the right column from
              the very top — the fold was otherwise half empty — while the copy
              and the beats stack down the left. Source order is hero → tree →
              beats, which is also the right order once this collapses on mobile. */}
          <div className="mx-auto max-w-6xl md:grid md:grid-cols-2 md:gap-x-16">
            <div className="pt-20 sm:pt-28 md:col-start-1 md:row-start-1">
              <div className="flex items-center gap-3">
                <Mark size={30} />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                  {t("hero.eyebrow")}
                </span>
              </div>

              <h1
                id="hero"
                // Steps up in three, not two: jumping straight to 6xl at the sm
                // breakpoint overflows short viewports (a 800×450 window pushed
                // the CTAs 290px below the fold).
                className="mt-6 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl"
              >
                {t.rich("hero.heading", {
                  accent: (chunks) => <span className="text-accent">{chunks}</span>,
                })}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
                {t("hero.lede")}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tree"
                  className="flex h-[42px] items-center justify-center rounded-md bg-zinc-100 px-6 text-center text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
                >
                  {t("hero.cta")}
                </Link>
                <Link
                  href="/dashboard"
                  className="flex h-[42px] items-center justify-center rounded-md border border-zinc-700 px-6 text-center text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                >
                  {t("hero.dashboard")}
                </Link>
              </div>

              <p className="mt-4 text-xs text-zinc-500">
                {t("hero.note")}
              </p>
            </div>

            {/* The tree spans both rows so the sticky child has the full scroll
                length of the copy beside it to travel through. */}
            <div className="mt-14 md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0">
              <div className="flex flex-col justify-center md:sticky md:top-0 md:h-screen">
                <div id="dt-tree" className="h-[46vh] w-full md:h-[72vh]">
                  <div
                    className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: tree.svg }}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-start-1 md:row-start-2">
              {beats.map((beat, i) => (
                <div
                  key={beat.title}
                  data-beat={i}
                  className="flex min-h-[42vh] flex-col justify-center border-t border-zinc-900 py-10 md:min-h-[80vh]"
                >
                  {/* A plain index, not "Gen I" — the reveal now runs across five
                      generations at a granularity the copy doesn't map onto, so
                      naming generations here would contradict the tree. */}
                  <span className="font-mono text-[11px] tracking-[0.2em] text-zinc-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-100">
                    {beat.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-zinc-400">{beat.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What it does */}
        <section
          aria-labelledby="what-it-does"
          className="border-t border-zinc-900 px-6 py-16"
        >
          <div className="mx-auto max-w-3xl space-y-5">
            <h2
              id="what-it-does"
              className="text-2xl font-semibold tracking-tight text-zinc-100"
            >
              {t("what.heading")}
            </h2>
            <p className="leading-relaxed text-zinc-400">{t("what.p1")}</p>
            <p className="leading-relaxed text-zinc-400">{t("what.p2")}</p>
            <p className="leading-relaxed text-zinc-400">
              {t.rich("what.p3", {
                canvas: (chunks) => (
                  <Link
                    href="/tree"
                    className="text-zinc-200 underline underline-offset-4 hover:text-white"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </section>

        {/* Features */}
        <section
          aria-labelledby="features"
          className="border-t border-zinc-900 px-6 py-16"
        >
          <div className="mx-auto max-w-4xl">
            <h2
              id="features"
              className="text-2xl font-semibold tracking-tight text-zinc-100"
            >
              {t("features.heading")}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5"
                >
                  <h3 className="text-base font-medium text-zinc-100">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section
          aria-labelledby="use-cases"
          className="border-t border-zinc-900 px-6 py-16"
        >
          <div className="mx-auto max-w-4xl">
            <h2
              id="use-cases"
              className="text-2xl font-semibold tracking-tight text-zinc-100"
            >
              {t("useCases.heading")}
            </h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              {useCases.map((useCase) => (
                <div key={useCase.title}>
                  <h3 className="text-base font-medium text-zinc-100">
                    {useCase.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {useCase.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="faq"
          className="border-t border-zinc-900 px-6 py-16"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id="faq"
              className="text-2xl font-semibold tracking-tight text-zinc-100"
            >
              {t("faq.heading")}
            </h2>
            <dl className="mt-8 space-y-8">
              {faq.map((item) => (
                <div key={item.q}>
                  <dt className="text-base font-medium text-zinc-100">
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-zinc-900 px-6 py-16 text-center">
          <div className="mx-auto max-w-xl space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
              {t("closing.heading")}
            </h2>
            <p className="leading-relaxed text-zinc-400">{t("closing.body")}</p>
            <div className="flex justify-center">
              <Link
                href="/tree"
                className="rounded-md bg-zinc-100 px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
              >
                {t("closing.cta")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer currentTool="Dynasty Tree Builder" />
    </div>
  );
}
