import { Fragment } from "react";
import { LegalDoc, Section, Bullets } from "@/components/legal/LegalDoc";

export const metadata = {
  title: { absolute: "Politique des Cookies · Bag Of Holding Tools" },
  robots: { index: false, follow: true },
};

export default function CookiesPage() {
  return (
    <LegalDoc
      titleFr="Politique des Cookies"
      titleEn="Cookie Policy"
      updated="Juillet / July 2026"
      fr={
        <>
          <Section title="1. Qu'est-ce qu'un cookie ?">
            <p>
              Un cookie est un petit fichier déposé sur votre navigateur lors de la consultation
              d&apos;un site. Cette page vous explique quels cookies et technologies de stockage
              sont utilisés par Bag Of Holding Tools et ses outils, dont Dynasty Tree Builder
              (ci-après, le « Site »).
            </p>
            <p>
              Le Site n&apos;utilise <strong className="text-zinc-300">aucun cookie
              publicitaire, de réseau social, de personnalisation ni de mesure d&apos;audience
              (analytics)</strong>. Aucun de vos usages n&apos;est suivi à des fins
              statistiques ou commerciales. Aucune bannière de consentement n&apos;est donc
              affichée.
            </p>
          </Section>

          <Section title="2. Cookies techniques et fonctionnels">
            <p>
              Seuls des cookies strictement nécessaires au fonctionnement du Site sont utilisés.
              Conformément à la réglementation, ils ne requièrent pas votre consentement.
            </p>
            <Bullets
              items={[
                <Fragment key="supabase-session">
                  <strong className="text-zinc-300">Cookie de session Supabase</strong> (par ex.{" "}
                  <code className="text-zinc-300">sb-…-auth-token</code>) — vous maintient
                  connecté à votre compte. Déposé uniquement si vous créez un compte et vous
                  connectez. Durée : jusqu&apos;à votre déconnexion ou l&apos;expiration de la
                  session.
                </Fragment>,
              ]}
            />
          </Section>

          <Section title="3. Stockage local (mode invité)">
            <p>
              En mode invité (sans compte), le Site utilise le stockage local
              (<code className="text-zinc-300">localStorage</code>) de votre navigateur pour
              enregistrer votre travail sur votre propre appareil. Ces données ne sont jamais
              envoyées à nos serveurs et sont supprimées lorsque vous videz le stockage de votre
              navigateur. Ce mécanisme est strictement nécessaire et ne requiert pas votre
              consentement.
            </p>
          </Section>

          <Section title="4. Cookies non utilisés">
            <p>
              Par transparence, les catégories de cookies suivantes ne sont
              <strong className="text-zinc-300"> pas</strong> utilisées par le Site :
            </p>
            <Bullets
              items={[
                "Cookies publicitaires — néant",
                "Cookies de réseaux sociaux — néant",
                "Cookies de personnalisation de contenu — néant",
                "Cookies de mesure d'audience / analytics — néant",
              ]}
            />
          </Section>

          <Section title="5. Paramétrer votre navigateur">
            <p>
              Vous pouvez à tout moment configurer votre navigateur pour bloquer ou supprimer les
              cookies. Attention : sans le cookie de session, vous ne pourrez pas rester connecté
              à votre compte. Pour en savoir plus, consultez le site de la CNIL :{" "}
              <a
                href="https://www.cnil.fr/fr/cookies-et-autres-traceurs"
                className="underline hover:text-zinc-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                cnil.fr
              </a>
              .
            </p>
          </Section>
        </>
      }
      en={
        <>
          <Section title="1. What is a cookie?">
            <p>
              A cookie is a small file placed on your browser when you visit a site. This page
              explains which cookies and storage technologies are used by Bag Of Holding Tools and
              its tools, including Dynasty Tree Builder (the &quot;Site&quot;).
            </p>
            <p>
              The Site uses <strong className="text-zinc-300">no advertising, social-media,
              personalization or analytics cookies</strong>. None of your activity is tracked for
              statistical or commercial purposes. No consent banner is therefore shown.
            </p>
          </Section>

          <Section title="2. Strictly necessary cookies">
            <p>
              Only cookies strictly necessary for the Site to function are used. Under the
              applicable rules, they do not require your consent.
            </p>
            <Bullets
              items={[
                <Fragment key="supabase-session">
                  <strong className="text-zinc-300">Supabase session cookie</strong> (e.g.{" "}
                  <code className="text-zinc-300">sb-…-auth-token</code>) — keeps you signed in to
                  your account. Only set if you create an account and sign in. Duration: until you
                  sign out or the session expires.
                </Fragment>,
              ]}
            />
          </Section>

          <Section title="3. Local storage (guest mode)">
            <p>
              In guest mode (no account), the Site uses your browser&apos;s local storage
              (<code className="text-zinc-300">localStorage</code>) to save your work on your own
              device. This data is never sent to our servers and is deleted when you clear your
              browser storage. This mechanism is strictly necessary and does not require your
              consent.
            </p>
          </Section>

          <Section title="4. Cookies not used">
            <p>
              For transparency, the following cookie categories are
              <strong className="text-zinc-300"> not</strong> used by the Site:
            </p>
            <Bullets
              items={[
                "Advertising cookies — none",
                "Social-media cookies — none",
                "Content personalization cookies — none",
                "Analytics / audience-measurement cookies — none",
              ]}
            />
          </Section>

          <Section title="5. Managing your browser">
            <p>
              You can configure your browser at any time to block or delete cookies. Note: without
              the session cookie, you will not be able to stay signed in to your account. To learn
              more, see the CNIL website:{" "}
              <a
                href="https://www.cnil.fr/en/cookies-and-other-tracking-devices"
                className="underline hover:text-zinc-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                cnil.fr
              </a>
              .
            </p>
          </Section>
        </>
      }
    />
  );
}
