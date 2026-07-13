import { LegalDoc, Section, Bullets, Mail } from "@/components/legal/LegalDoc";

export const metadata = {
  title: "Conditions Générales d'Utilisation · Bag Of Holding Tools",
};

const EMAIL = "marc.gapasinpro@gmail.com";

export default function TermsPage() {
  return (
    <LegalDoc
      titleFr="Conditions Générales d'Utilisation"
      titleEn="Terms of Use"
      updated="Juillet / July 2026"
      fr={
        <>
          <Section title="1. Objet">
            <p>
              Les présentes conditions générales d&apos;utilisation (« CGU ») régissent
              l&apos;accès et l&apos;utilisation de tous les outils publiés sous Bag Of Holding
              Tools par l&apos;entreprise individuelle de Marc GAPASIN (SIREN 940&nbsp;713&nbsp;571,
              3 chemin Abel Tissot – 93210 Saint-Denis), dont Dynasty Tree Builder (ci-après,
              ensemble, les « Outils »). Chaque Outil est gratuit, avec ou sans compte, et
              n&apos;implique aucun paiement.
            </p>
          </Section>

          <Section title="2. Acceptation">
            <p>
              En utilisant un Outil, vous acceptez pleinement et sans réserve les présentes CGU. Si
              vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser les Outils.
            </p>
          </Section>

          <Section title="3. Capacité juridique">
            <p>
              Les Outils sont accessibles à toute personne disposant de la capacité juridique pour
              s&apos;engager au titre des présentes. Une personne mineure ne peut les utiliser
              qu&apos;avec l&apos;accord de son représentant légal.
            </p>
          </Section>

          <Section title="4. Compte">
            <p>
              La création d&apos;un compte est facultative et sert uniquement à sauvegarder votre
              travail dans le cloud et à y accéder depuis plusieurs appareils. Un même compte
              fonctionne sur l&apos;ensemble des Outils. Vous êtes responsable de la sécurité de
              votre compte et vous engagez à ne pas laisser un tiers l&apos;utiliser à votre place.
            </p>
          </Section>

          <Section title="5. Disponibilité et absence de garantie">
            <p>
              Les Outils sont fournis « en l&apos;état », sans garantie de disponibilité,
              d&apos;exactitude ou d&apos;adéquation à un usage particulier. Nous ne garantissons
              pas que les Outils seront exempts d&apos;anomalies ou fonctionneront sans
              interruption, et pourrons suspendre l&apos;accès pour maintenance ou mise à jour.
            </p>
          </Section>

          <Section title="6. Votre contenu">
            <p>
              Vous conservez la pleine propriété des données que vous créez dans un Outil. En
              rendant un contenu public (par exemple en partageant un arbre via un lien), vous
              autorisez toute personne disposant du lien à le consulter. Vous pouvez révoquer ce
              partage à tout moment en le repassant en privé.
            </p>
          </Section>

          <Section title="7. Données concernant d'autres personnes">
            <p>
              Certains Outils vous permettent de saisir des informations sur d&apos;autres
              personnes réelles (par exemple des membres de votre famille). Vous êtes seul
              responsable du droit de saisir ces informations et de l&apos;usage que vous en faites.
              Vous ne devez pas saisir de données sur une personne que vous n&apos;êtes pas en droit
              de partager. En cas de réclamation concernant un contenu relatif à une personne
              réelle, nous pourrons le supprimer ou en restreindre l&apos;accès sans préavis, et
              vous vous engagez à nous garantir contre toute réclamation résultant des données que
              vous avez saisies sur des tiers.
            </p>
          </Section>

          <Section title="8. Comportements prohibés">
            <p>Il est notamment interdit :</p>
            <Bullets
              items={[
                "de créer ou partager un contenu illégal, préjudiciable, diffamatoire, haineux, incitant à la violence ou portant atteinte aux droits de tiers ;",
                "de perturber, ralentir ou tenter d'intrusion dans les systèmes ou infrastructures des Outils ;",
                "de contourner les dispositifs de sécurité ou d'authentification ;",
                "de revendre, monnayer ou concéder l'accès aux Outils.",
              ]}
            />
          </Section>

          <Section title="9. Signalement et modération">
            <p>
              Les contenus publics sont accessibles à toute personne disposant du lien. Les
              signalements sont examinés et peuvent conduire à rendre un contenu privé ou à le
              supprimer sans préavis. Pour signaler un contenu : <Mail address={EMAIL} />.
            </p>
          </Section>

          <Section title="10. Propriété intellectuelle">
            <p>
              Nous demeurons titulaires des droits de propriété intellectuelle sur les Outils. Les
              présentes CGU n&apos;opèrent aucun transfert de ces droits à votre bénéfice, en dehors
              d&apos;un droit d&apos;utilisation personnel et non exclusif limité à la durée de
              votre utilisation.
            </p>
          </Section>

          <Section title="11. Responsabilité">
            <p>
              Les Outils étant fournis gratuitement, et dans toute la mesure permise par la loi,
              nous ne saurions être tenus responsables des dommages résultant de l&apos;utilisation
              ou de l&apos;impossibilité d&apos;utiliser un Outil, ni des contenus créés, partagés
              ou consultés par les utilisateurs.
            </p>
          </Section>

          <Section title="12. Résiliation">
            <p>
              Vous pouvez supprimer votre compte à tout moment. Nous nous réservons le droit de
              suspendre l&apos;accès ou de supprimer tout contenu, dans tout Outil, en cas de
              violation des présentes.
            </p>
          </Section>

          <Section title="13. Données personnelles">
            <p>
              Le traitement de vos données personnelles est décrit dans notre{" "}
              <a href="/privacy" className="underline hover:text-zinc-100">
                Charte de Confidentialité
              </a>
              .
            </p>
          </Section>

          <Section title="14. Modifications">
            <p>
              Nous pouvons modifier les présentes CGU à mesure que des Outils sont ajoutés ou
              modifiés. Toute utilisation postérieure à une mise à jour vaut acceptation des CGU
              révisées.
            </p>
          </Section>

          <Section title="15. Langue">
            <p>
              Les présentes CGU sont rédigées en français et en anglais. En cas de contradiction ou
              de contestation sur la signification d&apos;un terme, la version française prévaut.
            </p>
          </Section>

          <Section title="16. Loi applicable">
            <p>
              Les présentes CGU sont régies par la loi française. Tout litige non résolu à
              l&apos;amiable relèvera de la compétence exclusive des tribunaux français.
            </p>
          </Section>

          <Section title="17. Contact">
            <p>
              Toute question relative aux présentes CGU : <Mail address={EMAIL} />.
            </p>
          </Section>
        </>
      }
      en={
        <>
          <Section title="1. Purpose">
            <p>
              These terms of use (&quot;Terms&quot;) govern access to and use of all tools published
              under Bag Of Holding Tools by the sole proprietorship of Marc GAPASIN (SIREN
              940&nbsp;713&nbsp;571, 3 chemin Abel Tissot – 93210 Saint-Denis, France), including
              Dynasty Tree Builder (together, the &quot;Tools&quot;). Each Tool is free, with or
              without an account, and involves no payment.
            </p>
          </Section>

          <Section title="2. Acceptance">
            <p>
              By using a Tool, you fully and unreservedly accept these Terms. If you do not accept
              them, you must not use the Tools.
            </p>
          </Section>

          <Section title="3. Legal capacity">
            <p>
              The Tools are accessible to anyone with the legal capacity to be bound by these Terms.
              A minor may only use them with the consent of their legal guardian.
            </p>
          </Section>

          <Section title="4. Account">
            <p>
              Creating an account is optional and only exists to save your work to the cloud and
              access it from multiple devices. One account works across all Tools. You are
              responsible for keeping your account secure and agree not to let a third party use it
              on your behalf.
            </p>
          </Section>

          <Section title="5. Availability and no warranty">
            <p>
              The Tools are provided &quot;as is&quot;, with no guarantee of availability, accuracy
              or fitness for a particular purpose. We do not warrant that the Tools will be free of
              defects or operate without interruption, and we may suspend access for maintenance or
              updates.
            </p>
          </Section>

          <Section title="6. Your content">
            <p>
              You retain full ownership of the data you create in a Tool. By making content public
              (for example by sharing a tree via a link), you allow anyone with the link to view it.
              You may revoke this at any time by making it private again.
            </p>
          </Section>

          <Section title="7. Data about other people">
            <p>
              Some Tools let you enter information about other real people (for example family
              members). You are solely responsible for having the right to enter that information
              and for how you use it. You must not enter data about someone you are not entitled to
              share. If a complaint is made about content concerning a real person, we may remove or
              restrict access to it without prior notice, and you agree to indemnify us against any
              claim arising from data you entered about others.
            </p>
          </Section>

          <Section title="8. Prohibited conduct">
            <p>The following is prohibited, among other things:</p>
            <Bullets
              items={[
                "creating or sharing content that is illegal, harmful, defamatory, hateful, promotes violence, or infringes the rights of others;",
                "disrupting, slowing down or attempting to intrude into the systems or infrastructure of the Tools;",
                "circumventing security or authentication measures;",
                "reselling, monetizing or licensing access to the Tools.",
              ]}
            />
          </Section>

          <Section title="9. Reporting and moderation">
            <p>
              Public content is accessible to anyone with the link. Reports are reviewed and may
              lead to content being made private or removed without prior notice. To report content:{" "}
              <Mail address={EMAIL} />.
            </p>
          </Section>

          <Section title="10. Intellectual property">
            <p>
              We remain the owner of the intellectual property rights in the Tools. These Terms
              transfer none of those rights to you, other than a personal, non-exclusive right to
              use them for the duration of your use.
            </p>
          </Section>

          <Section title="11. Liability">
            <p>
              As the Tools are provided free of charge, and to the maximum extent permitted by law,
              we cannot be held liable for any damages arising from the use or inability to use a
              Tool, or from any content created, shared or accessed by users.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              You may delete your account at any time. We reserve the right to suspend access or
              remove any content, in any Tool, in the event of a breach of these Terms.
            </p>
          </Section>

          <Section title="13. Personal data">
            <p>
              The processing of your personal data is described in our{" "}
              <a href="/privacy" className="underline hover:text-zinc-100">
                Privacy Policy
              </a>
              .
            </p>
          </Section>

          <Section title="14. Changes">
            <p>
              We may update these Terms as Tools are added or changed. Continued use after an update
              constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="15. Language">
            <p>
              These Terms are written in French and English. In the event of any conflict or dispute
              over the meaning of a term, the French version prevails.
            </p>
          </Section>

          <Section title="16. Governing law">
            <p>
              These Terms are governed by French law. Any dispute not resolved amicably will fall
              under the exclusive jurisdiction of the French courts.
            </p>
          </Section>

          <Section title="17. Contact">
            <p>
              Any question about these Terms: <Mail address={EMAIL} />.
            </p>
          </Section>
        </>
      }
    />
  );
}
