import { Fragment } from "react";
import { LegalDoc, Section, Bullets, Mail } from "@/components/legal/LegalDoc";

// These bilingual documents are shared verbatim across every Bag Of Holding
// Tools site, so they are kept out of the index to avoid duplicate content.
// `absolute` stops the root layout template appending a second suffix.
export const metadata = {
  title: { absolute: "Charte de Confidentialité · Bag Of Holding Tools" },
  robots: { index: false, follow: true },
};

const EMAIL = "marc.gapasinpro@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalDoc
      titleFr="Charte de Confidentialité"
      titleEn="Privacy Policy"
      updated="Juillet / July 2026"
      fr={
        <>
          <Section title="Préambule">
            <p>
              La présente charte s&apos;applique à l&apos;ensemble des outils publiés sous
              Bag Of Holding Tools, dont Dynasty Tree Builder. Tous les outils partagent le même
              système de compte, une seule charte les couvre donc tous. Elle a pour objet de vous
              expliquer comment sont collectées, traitées et conservées vos données à caractère
              personnel, conformément à la loi n° 78-17 du 6 janvier 1978 (« Informatique et
              Libertés ») et au règlement (UE) 2016/679 (« RGPD »).
            </p>
          </Section>

          <Section title="1. Définition">
            <p>
              Le terme « données à caractère personnel » désigne toute information permettant de
              vous identifier directement ou indirectement, comme votre adresse email.
            </p>
          </Section>

          <Section title="2. Responsable de traitement">
            <p>
              Le responsable de traitement est l&apos;entreprise individuelle de Marc GAPASIN,
              domiciliée au 3 chemin Abel Tissot – 93210 Saint-Denis, immatriculée sous le numéro
              940&nbsp;713&nbsp;571 (« Nous »).
            </p>
          </Section>

          <Section title="3. Mode invité (sans compte)">
            <p>
              Vous pouvez utiliser tous les outils sans créer de compte. En mode invité, vos
              données (personnages, relations et tout contenu créé) sont stockées uniquement dans
              votre navigateur (localStorage) et ne sont jamais envoyées à nos serveurs.
              L&apos;export en PNG ou JSON se fait entièrement sur votre appareil. Nous n&apos;avons
              aucun accès aux données du mode invité.
            </p>
          </Section>

          <Section title="4. Données collectées et finalités (mode compte)">
            <p>
              La création d&apos;un compte est facultative et sert uniquement à sauvegarder votre
              travail dans le cloud. Lorsque vous vous connectez avec Google, nous collectons :
            </p>
            <Bullets
              items={[
                "Votre adresse email (fournie par Google) ;",
                "Les données que vous créez dans chaque outil (par ex. personnages, relations, rôles et noms personnalisés pour Dynasty Tree Builder).",
              ]}
            />
            <p>
              Nous ne collectons ni votre nom, ni votre photo de profil, ni aucune autre donnée de
              votre compte Google au-delà de votre adresse email. La base juridique de ces
              traitements est l&apos;exécution du contrat que vous concluez en créant un compte.
              Vos données servent exclusivement à vous identifier et à vous permettre
              d&apos;accéder à votre travail entre vos sessions et appareils.
            </p>
          </Section>

          <Section title="5. Destinataires et sous-traitants">
            <p>Vos données de compte sont traitées par les prestataires suivants, aux seules fins de fournir le service :</p>
            <Bullets
              items={[
                <Fragment key="supabase">
                  <strong className="text-zinc-300">Supabase</strong> (région Union européenne) —
                  authentification et hébergement de la base de données ;
                </Fragment>,
                <Fragment key="vercel">
                  <strong className="text-zinc-300">Vercel</strong> — hébergement de
                  l&apos;application ;
                </Fragment>,
                <Fragment key="google">
                  <strong className="text-zinc-300">Google</strong> — fournisseur de connexion
                  (OAuth).
                </Fragment>,
              ]}
            />
            <p>Vos données ne sont jamais vendues, louées ni partagées avec un tiers en dehors de ces prestataires.</p>
          </Section>

          <Section title="6. Durée de conservation">
            <p>
              Vos données de compte sont conservées tant que votre compte existe. Vous pouvez
              demander la suppression de votre compte et de toutes les données associées à tout
              moment en écrivant à <Mail address={EMAIL} />. La suppression est définitive.
            </p>
          </Section>

          <Section title="7. Sécurité">
            <p>
              Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour
              préserver la sécurité, l&apos;intégrité et la confidentialité de vos données et
              empêcher qu&apos;un tiers non autorisé y ait accès.
            </p>
          </Section>

          <Section title="8. Hébergement">
            <p>
              Vos données de compte sont stockées sur les serveurs de Supabase, dans une région
              située au sein de l&apos;Union européenne.
            </p>
          </Section>

          <Section title="9. Transfert hors de l'Union européenne">
            <p>
              Vercel et Google sont établis aux États-Unis. Lorsque vos données sont transférées
              hors de l&apos;Union européenne, ce transfert est encadré soit par une décision
              d&apos;adéquation (dont le EU–US Data Privacy Framework), soit par les clauses
              contractuelles types approuvées par la Commission européenne.
            </p>
          </Section>

          <Section title="10. Vos droits">
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <Bullets
              items={[
                "Droit d'accès, de rectification et d'effacement de vos données ;",
                "Droit à la limitation du traitement ;",
                "Droit à la portabilité (recevoir vos données dans un format lisible par machine) ;",
                "Droit d'opposition au traitement ;",
                "Droit de retirer votre consentement à tout moment ;",
                "Droit de définir des directives relatives au sort de vos données après votre décès.",
              ]}
            />
            <p>
              Ces droits s&apos;exercent en écrivant à <Mail address={EMAIL} /> ou par courrier au
              3 chemin Abel Tissot – 93210 Saint-Denis.
            </p>
          </Section>

          <Section title="11. Réclamation auprès d'une autorité de contrôle">
            <p>
              Vous avez le droit d&apos;introduire une réclamation auprès d&apos;une autorité de
              contrôle, en France la{" "}
              <a href="https://www.cnil.fr" className="underline hover:text-zinc-100" target="_blank" rel="noopener noreferrer">
                CNIL
              </a>
              , si vous estimez que le traitement de vos données constitue une violation des textes
              applicables.
            </p>
          </Section>

          <Section title="12. Données concernant des tiers">
            <p>
              Certains outils vous permettent de saisir des informations sur d&apos;autres
              personnes (par exemple des membres de votre famille). Vous êtes responsable du droit
              de saisir ces informations — voir nos{" "}
              <a href="/terms" className="underline hover:text-zinc-100">
                Conditions Générales d&apos;Utilisation
              </a>
              . Si un tiers souhaite que des informations le concernant soient supprimées d&apos;un
              compte qu&apos;il ne contrôle pas, il peut nous contacter et nous transmettrons la
              demande au titulaire du compte ou y donnerons suite lorsque la loi l&apos;exige.
            </p>
          </Section>

          <Section title="13. Mineurs">
            <p>
              Nos outils ne sont pas destinés aux enfants de moins de 15 ans. Si vous pensez
              qu&apos;un enfant de moins de 15 ans a créé un compte, contactez-nous et nous le
              supprimerons.
            </p>
          </Section>

          <Section title="14. Modifications">
            <p>
              Nous pouvons modifier la présente charte à mesure que des outils sont ajoutés ou
              modifiés. Les modifications entrent en vigueur dès leur publication, reflétée par la
              date de mise à jour ci-dessus.
            </p>
          </Section>

          <Section title="15. Contact">
            <p>
              Toute question relative à la présente charte : <Mail address={EMAIL} />.
            </p>
          </Section>
        </>
      }
      en={
        <>
          <Section title="Preamble">
            <p>
              This policy applies to all tools published under Bag Of Holding Tools, including
              Dynasty Tree Builder. All tools share the same account system, so one policy covers
              all of them. It explains how your personal data is collected, processed and retained,
              in accordance with French Law no. 78-17 of 6 January 1978 (&quot;Informatique et
              Libertés&quot;) and Regulation (EU) 2016/679 (&quot;GDPR&quot;).
            </p>
          </Section>

          <Section title="1. Definition">
            <p>
              &quot;Personal data&quot; means any information that can identify you directly or
              indirectly, such as your email address.
            </p>
          </Section>

          <Section title="2. Data controller">
            <p>
              The data controller is the sole proprietorship of Marc GAPASIN, located at 3 chemin
              Abel Tissot – 93210 Saint-Denis, France, registered under number
              940&nbsp;713&nbsp;571 (&quot;We&quot;).
            </p>
          </Section>

          <Section title="3. Guest mode (no account)">
            <p>
              You can use every tool without creating an account. In guest mode, your data
              (characters, relationships and any content you create) is stored only in your browser
              (localStorage) and is never sent to our servers. Exporting to PNG or JSON happens
              entirely on your device. We have no access to guest-mode data.
            </p>
          </Section>

          <Section title="4. Data collected and purposes (account mode)">
            <p>
              Creating an account is optional and only exists to save your work to the cloud. When
              you sign in with Google, we collect:
            </p>
            <Bullets
              items={[
                "Your email address (provided by Google);",
                "The data you create in each tool (e.g. characters, relationships, roles and custom names for Dynasty Tree Builder).",
              ]}
            />
            <p>
              We do not collect your name, profile picture, or any other Google account data beyond
              your email address. The legal basis for this processing is the performance of the
              contract you enter into by creating an account. Your data is used solely to identify
              you and let you access your work across sessions and devices.
            </p>
          </Section>

          <Section title="5. Recipients and subprocessors">
            <p>Your account data is processed by the following providers, solely to operate the service:</p>
            <Bullets
              items={[
                <Fragment key="supabase">
                  <strong className="text-zinc-300">Supabase</strong> (EU region) — authentication
                  and database hosting;
                </Fragment>,
                <Fragment key="vercel">
                  <strong className="text-zinc-300">Vercel</strong> — application hosting;
                </Fragment>,
                <Fragment key="google">
                  <strong className="text-zinc-300">Google</strong> — sign-in (OAuth) provider.
                </Fragment>,
              ]}
            />
            <p>Your data is never sold, rented, or shared with any third party beyond these providers.</p>
          </Section>

          <Section title="6. Data retention">
            <p>
              Account data is retained for as long as your account exists. You may request deletion
              of your account and all associated data at any time by writing to{" "}
              <Mail address={EMAIL} />. Deletion is permanent.
            </p>
          </Section>

          <Section title="7. Security">
            <p>
              We implement appropriate technical and organizational measures to preserve the
              security, integrity and confidentiality of your data and to prevent unauthorized
              third-party access.
            </p>
          </Section>

          <Section title="8. Hosting">
            <p>Your account data is stored on Supabase servers, in a region located within the European Union.</p>
          </Section>

          <Section title="9. Transfers outside the European Union">
            <p>
              Vercel and Google are based in the United States. Where your data is transferred
              outside the European Union, that transfer is covered either by an adequacy decision
              (including the EU–US Data Privacy Framework) or by the standard contractual clauses
              approved by the European Commission.
            </p>
          </Section>

          <Section title="10. Your rights">
            <p>Under the GDPR, you have the following rights:</p>
            <Bullets
              items={[
                "Right of access, rectification and erasure of your data;",
                "Right to restrict processing;",
                "Right to data portability (receive your data in a machine-readable format);",
                "Right to object to processing;",
                "Right to withdraw your consent at any time;",
                "Right to define directives on what happens to your data after your death.",
              ]}
            />
            <p>
              You can exercise these rights by writing to <Mail address={EMAIL} /> or by post to
              3 chemin Abel Tissot – 93210 Saint-Denis, France.
            </p>
          </Section>

          <Section title="11. Complaint to a supervisory authority">
            <p>
              You have the right to lodge a complaint with a supervisory authority — in France the{" "}
              <a href="https://www.cnil.fr" className="underline hover:text-zinc-100" target="_blank" rel="noopener noreferrer">
                CNIL
              </a>{" "}
              — if you believe the processing of your data breaches applicable law.
            </p>
          </Section>

          <Section title="12. Data about third parties">
            <p>
              Some tools let you enter information about other people (for example family members).
              You are responsible for having the right to enter that information — see our{" "}
              <a href="/terms" className="underline hover:text-zinc-100">
                Terms of Use
              </a>
              . If a third party wants information about them removed from an account they do not
              control, they can contact us and we will forward the request to the account holder or
              act on it directly where required by law.
            </p>
          </Section>

          <Section title="13. Children">
            <p>
              Our tools are not directed at children under 15. If you believe a child under 15 has
              created an account, contact us and we will delete it.
            </p>
          </Section>

          <Section title="14. Changes">
            <p>
              We may update this policy as tools are added or changed. Changes take effect upon
              publication, reflected in the last-updated date above.
            </p>
          </Section>

          <Section title="15. Contact">
            <p>
              Any question about this policy: <Mail address={EMAIL} />.
            </p>
          </Section>
        </>
      }
    />
  );
}
