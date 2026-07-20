import { LegalDoc, Section, Mail } from "@/components/legal/LegalDoc";

export const metadata = {
  title: { absolute: "Mentions Légales · Bag Of Holding Tools" },
  robots: { index: false, follow: true },
};

export default function LegalNoticePage() {
  return (
    <LegalDoc
      titleFr="Mentions Légales"
      titleEn="Legal Notice"
      updated="Juillet / July 2026"
      fr={
        <>
          <Section title="Édition du site">
            <p>
              Le site Bag Of Holding Tools et l&apos;ensemble de ses outils, dont Dynasty Tree
              Builder (ci-après, le « Site »), sont édités par l&apos;entreprise individuelle de
              Marc GAPASIN, domiciliée au 3 chemin Abel Tissot – 93210 Saint-Denis et
              immatriculée sous le numéro 940&nbsp;713&nbsp;571 (ci-après, l&apos;« Éditeur »).
            </p>
            <p>
              L&apos;Éditeur peut être contacté à l&apos;adresse email{" "}
              <Mail address="marc.gapasinpro@gmail.com" /> ou au numéro +33 (0)6 40 47 28 70.
            </p>
          </Section>

          <Section title="Directeur de la publication">
            <p>Le directeur de la publication est Monsieur Marc GAPASIN.</p>
          </Section>

          <Section title="Hébergement du site">
            <p>
              Le Site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
              États-Unis (<a href="https://vercel.com" className="underline hover:text-zinc-100" target="_blank" rel="noopener noreferrer">vercel.com</a>).
            </p>
            <p>
              Les données de compte sont stockées par Supabase, dans une région située au sein
              de l&apos;Union européenne (<a href="https://supabase.com" className="underline hover:text-zinc-100" target="_blank" rel="noopener noreferrer">supabase.com</a>).
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              Toutes les marques, textes, illustrations, images ainsi que les applications
              informatiques qui composent le Site sont protégés au titre de la propriété
              intellectuelle et sont la propriété de l&apos;Éditeur, sauf mentions particulières.
              Toute reproduction, représentation ou adaptation, en tout ou partie, sans
              l&apos;accord préalable et écrit de l&apos;Éditeur, est strictement interdite.
            </p>
            <p>
              Les données que vous créez au sein d&apos;un outil (par exemple votre arbre
              généalogique) vous appartiennent et ne sont pas revendiquées par l&apos;Éditeur.
            </p>
          </Section>

          <Section title="Liens hypertextes">
            <p>
              Le Site peut contenir des liens vers d&apos;autres sites édités et gérés par des
              tiers. L&apos;Éditeur ne saurait être tenu responsable, directement ou
              indirectement, du contenu de ces sites tiers.
            </p>
          </Section>
        </>
      }
      en={
        <>
          <Section title="Site publisher">
            <p>
              The Bag Of Holding Tools site and all of its tools, including Dynasty Tree Builder
              (the &quot;Site&quot;), are published by the sole proprietorship (entreprise
              individuelle) of Marc GAPASIN, located at 3 chemin Abel Tissot – 93210 Saint-Denis,
              France, registered under number 940&nbsp;713&nbsp;571 (the &quot;Publisher&quot;).
            </p>
            <p>
              The Publisher can be reached at <Mail address="marc.gapasinpro@gmail.com" /> or on
              +33 (0)6 40 47 28 70.
            </p>
          </Section>

          <Section title="Publication director">
            <p>The publication director is Mr Marc GAPASIN.</p>
          </Section>

          <Section title="Hosting">
            <p>
              The Site is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA
              (<a href="https://vercel.com" className="underline hover:text-zinc-100" target="_blank" rel="noopener noreferrer">vercel.com</a>).
            </p>
            <p>
              Account data is stored by Supabase, in a region located within the European Union
              (<a href="https://supabase.com" className="underline hover:text-zinc-100" target="_blank" rel="noopener noreferrer">supabase.com</a>).
            </p>
          </Section>

          <Section title="Intellectual property">
            <p>
              All trademarks, text, illustrations, images and software that make up the Site are
              protected under intellectual property law and are the property of the Publisher,
              except where otherwise stated. Any reproduction, representation or adaptation, in
              whole or in part, without the Publisher&apos;s prior written consent, is strictly
              prohibited.
            </p>
            <p>
              The data you create within a tool (for example your family tree) belongs to you and
              is not claimed by the Publisher.
            </p>
          </Section>

          <Section title="Hyperlinks">
            <p>
              The Site may contain links to other sites published and managed by third parties.
              The Publisher cannot be held liable, directly or indirectly, for the content of
              those third-party sites.
            </p>
          </Section>
        </>
      }
    />
  );
}
