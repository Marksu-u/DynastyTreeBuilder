export const metadata = {
  title: "Terms of Service · Dynasty Tree Builder",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-sm text-zinc-300">
      <h1 className="mb-2 text-2xl font-bold text-zinc-100">Terms of Service</h1>
      <p className="mb-8 text-zinc-500">Last updated: May 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">1. The service</h2>
          <p>
            Dynasty Tree Builder is a free tool for creating and visualising
            dynasty trees. It is provided as-is, with no guarantees of
            availability, accuracy, or fitness for any purpose.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">2. Your content</h2>
          <p>
            You retain full ownership of the dynasty data you create. By making
            a dynasty public, you grant anyone with the link the ability to view
            it. You may revoke this at any time by marking the dynasty private in
            its settings.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">3. Acceptable use</h2>
          <p>
            You must not use this tool to create or share content that is
            illegal, harmful, defamatory, or that infringes on the rights of
            others. This includes but is not limited to hate speech, content that
            promotes violence, and content that violates intellectual property
            rights.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">4. Public shares and moderation</h2>
          <p>
            Public dynasty shares are accessible to anyone with the link. Reports
            submitted by users are reviewed and may result in content being made
            private or removed without prior notice. The operator is not liable
            for any content created or shared by users.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">5. Termination</h2>
          <p>
            The operator reserves the right to suspend access or remove any
            content at their sole discretion, without notice, if these terms are
            violated.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">6. Limitation of liability</h2>
          <p>
            The service is provided free of charge. To the maximum extent
            permitted by law, the operator is not liable for any damages arising
            from the use or inability to use the service, or from any content
            created, shared, or accessed through it.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">7. Contact</h2>
          <p>
            Questions about these terms:{" "}
            <a
              href="mailto:markus.gapaz@gmail.com"
              className="underline hover:text-zinc-100"
            >
              markus.gapaz@gmail.com
            </a>
          </p>
        </div>
      </section>

      <div className="mt-12">
        <a href="/" className="text-xs text-zinc-500 underline hover:text-zinc-300">
          ← Back to Dynasty Tree Builder
        </a>
      </div>
    </main>
  );
}
