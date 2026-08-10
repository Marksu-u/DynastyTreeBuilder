import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/legal/Footer";
import { FramedHeader } from "@/components/shell/FramedHeader";
import { SOURCE_REPO_URL } from "@/components/legal/ecosystem";
import { TreeScrollStager } from "@/components/landing/TreeScrollStager";
import { renderLandingTree } from "@/lib/landing-tree";
import { buildOgGraph } from "@/lib/og-tree";
import { landingDynasty } from "@/lib/seed/landing-dynasty";
import { Crest } from "@/components/ui/Crest";

export const metadata: Metadata = {
  title: { absolute: "Dynasty Tree Builder — D&D & TTRPG Family Tree Maker" },
  description:
    "A free family tree maker for D&D and TTRPG campaigns. Map noble houses, NPC relationships, bloodlines and rivalries on a drag-and-drop canvas, then share a link or export a PNG. No account needed.",
  alternates: { canonical: "/" },
};

const FAQ = [
  {
    q: "Is Dynasty Tree Builder free?",
    a: "Yes. Building, sharing and exporting dynasty trees is free, with no trial period and no payment details. Signing in is optional and only exists so your trees follow you between devices.",
  },
  {
    q: "Do I need an account to make a family tree?",
    a: "No. Guest mode opens straight onto the canvas and saves your dynasty in your own browser's local storage. If you later create an account, the tree you built as a guest can be imported into it.",
  },
  {
    q: "Can I use it for D&D, Pathfinder or a homebrew system?",
    a: "Yes. Nothing in the tool is tied to a ruleset. Characters carry a name, an optional alias, a role and narrative flags, so it works for any tabletop RPG, play-by-post game or novel-writing project.",
  },
  {
    q: "How do I share a dynasty tree with my players?",
    a: "Publish the dynasty and you get a read-only share link. Anyone with the link sees the same canvas — pan, zoom, follow bloodlines and export a PNG — but cannot change anything. Unpublish at any time to break the link.",
  },
  {
    q: "Can I export the family tree as an image?",
    a: "Yes. One click exports the whole canvas as a high-resolution PNG that crops to your characters, so you can drop it into a campaign wiki, a Discord channel, a session handout or a VTT.",
  },
  {
    q: "How many characters can one dynasty hold?",
    a: "There is no fixed cap. The layout engine places generations in bands and packs siblings together, so large houses spanning many generations stay readable instead of turning into a tangle of crossing lines.",
  },
  {
    q: "Does it handle bastards, adoptions and multiple partners?",
    a: "Yes. A character can have several partners, each with their own offspring line, and children can be marked as adopted or as bastards. Unknown parents can be left as placeholder nodes so an incomplete lineage still renders correctly.",
  },
];

const FEATURES = [
  {
    title: "A canvas built for lineages",
    body: "Drag characters around an infinite canvas. Generations snap into horizontal bands and siblings pack tightly, so a ten-generation house reads top to bottom without crossing lines.",
  },
  {
    title: "Relationships that mean something",
    body: "Connect people as parent/child, partner or adopted. Each relationship type draws its own edge style, and every link can carry a plot hook — the reason this connection matters at the table.",
  },
  {
    title: "Roles and narrative flags",
    body: "Give a character a role (Head of House, Heir, Consort, Rival, Mage, Rogue…) and stack permanent flags on top: founder, bastard, adopted, exile, deceased. Signed-in users can add their own custom roles.",
  },
  {
    title: "Share a read-only link",
    body: "Publish a dynasty and hand your players a link. They get the live canvas — pan, zoom, highlight a bloodline — with no ability to edit and no account of their own. Unpublish whenever the secret stops being a secret.",
  },
  {
    title: "PNG export",
    body: "Export the tree as a high-resolution PNG cropped to your characters. Works from the editor and from a shared view, so players can grab their own copy for the campaign wiki.",
  },
  {
    title: "Guest mode, no signup",
    body: "Open the canvas and start building. Guest dynasties live in your browser's local storage. Create an account only when you want the tree on more than one device — your guest work can be imported.",
  },
];

const USE_CASES = [
  {
    title: "Dungeon masters",
    body: "Keep the NPC relationship map for a court intrigue arc in one place. When a player asks who the duke's half-brother married, you have the answer on screen instead of buried three sessions back in your notes.",
  },
  {
    title: "Worldbuilders",
    body: "Trace a founding bloodline across centuries, split it into cadet branches, and mark which lines died out. The generation bands make the shape of a dynasty's rise and collapse visible at a glance.",
  },
  {
    title: "Players with a backstory",
    body: "Map your character's house before session one — who raised them, who disowned them, which cousin holds the title now. Share the link with your DM so the details survive contact with the campaign.",
  },
  {
    title: "Writers and play-by-post groups",
    body: "Nothing here is D&D-specific. Any story with a succession, a feud or a tangled family works: sci-fi houses, horror bloodlines, historical fiction, or a novel's cast you keep losing track of.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

/** The three beats of the sticky act, each revealing one more generation. */
const BEATS = [
  {
    title: "It starts with one name",
    body: "Open the canvas and add a founder. No account, no setup, no empty-project wizard — a card on a dark ground and somewhere to put the next one.",
  },
  {
    title: "Then the house complicates",
    body: "Add partners, children, second marriages. The layout engine keeps generations in bands and packs siblings together, so the shape stays readable while you improvise. Bastards, adoptions and exiles are flags, not workarounds.",
  },
  {
    title: "Until it has a shape you can hand to your players",
    body: "Hover any character to light their whole bloodline. Publish and you get a read-only link — the live canvas, no account needed at their end — or export the tree as a PNG for the campaign wiki.",
  },
];

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

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Dynasty Tree Builder",
  applicationCategory: "DesignApplication",
  applicationSubCategory: "Family tree maker for tabletop RPG campaigns",
  operatingSystem: "Web browser",
  url: siteUrl,
  description:
    "A free browser-based family tree maker for D&D and other TTRPG campaigns. Map characters, bloodlines, partnerships and rivalries on a canvas, then share a read-only link or export a PNG.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  featureList: FEATURES.map((feature) => feature.title),
  isAccessibleForFree: true,
  // Ties this page to the public repo as one entity, so a crawler that meets
  // either surface can resolve the other instead of guessing what the tool is.
  sameAs: [SOURCE_REPO_URL],
  codeRepository: SOURCE_REPO_URL,
  publisher: {
    "@type": "Organization",
    name: "Bag Of Holding Tools",
  },
};

export default function LandingPage() {
  const tree = heroTree();

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
          How it works
        </a>
        <a
          href="#faq"
          className="hidden text-xs text-zinc-500 transition-colors hover:text-zinc-300 sm:inline"
        >
          FAQ
        </a>
        <Link
          href="/login"
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          Sign in
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
                <Crest seed="house-thorne" size={30} />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                  Dynasty Tree Builder
                </span>
              </div>

              <h1
                id="hero"
                // Steps up in three, not two: jumping straight to 6xl at the sm
                // breakpoint overflows short viewports (a 800×450 window pushed
                // the CTAs 290px below the fold).
                className="mt-6 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl"
              >
                Every noble house is a{" "}
                <span className="text-accent">web of blood and betrayal</span>.
                Map yours.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
                A free family tree maker for D&amp;D and TTRPG campaigns —
                characters, bloodlines, partnerships and the rivalries your
                players keep tripping over.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tree"
                  className="rounded-md bg-zinc-100 px-6 py-2.5 text-center text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
                >
                  Start building — no account
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-md border border-zinc-700 px-6 py-2.5 text-center text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                >
                  Open dashboard
                </Link>
              </div>

              <p className="mt-4 text-xs text-zinc-500">
                Guest mode saves in your browser — sign in only to sync across devices.
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
              {BEATS.map((beat, i) => (
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
              A dynasty generator for tabletop campaigns
            </h2>
            <p className="leading-relaxed text-zinc-400">
              Most family tree software is built for genealogy: real ancestors,
              birth certificates, dates you can verify. Campaign families are
              messier. Half the parents are unknown, a third of the heirs are
              secretly bastards, two houses married for a treaty that has since
              collapsed, and the whole thing has to stay legible while you
              improvise at the table.
            </p>
            <p className="leading-relaxed text-zinc-400">
              Dynasty Tree Builder is a fantasy family tree builder made for
              that. You drop characters onto a canvas, link them as parents,
              partners or adopted children, and the layout engine arranges the
              generations for you. Every character carries a role and a set of
              narrative flags, so the tree doubles as a campaign NPC
              relationship map rather than just a chart of who begat whom.
            </p>
            <p className="leading-relaxed text-zinc-400">
              It runs in the browser, it is free, and you'll be building within ten seconds —{" "}
              <Link
                href="/tree"
                className="text-zinc-200 underline underline-offset-4 hover:text-white"
              >
                open the canvas as a guest
              </Link>{" "}
              and see.
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
              What you get
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((feature) => (
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
              Who it is for
            </h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              {USE_CASES.map((useCase) => (
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
              Frequently asked questions
            </h2>
            <dl className="mt-8 space-y-8">
              {FAQ.map((item) => (
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
              Map your first house
            </h2>
            <p className="leading-relaxed text-zinc-400">
              No signup, no trial, no card. Open the canvas, add a founder, and
              start branching.
            </p>
            <div className="flex justify-center">
              <Link
                href="/tree"
                className="rounded-md bg-zinc-100 px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
              >
                Open the canvas
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer currentTool="Dynasty Tree Builder" />
    </div>
  );
}
