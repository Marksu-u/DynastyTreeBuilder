export const metadata = {
  title: "Privacy Policy · Dynasty Tree Builder",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
    <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-zinc-300">
      <h1 className="mb-2 text-2xl font-bold text-zinc-100">Privacy Policy</h1>
      <p className="mb-8 text-zinc-500">Last updated: May 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">1. What we collect</h2>
          <p>When you sign in with Google, we store:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
            <li>Your email address (provided by Google)</li>
            <li>
              Your dynasty data — characters, relationships, role slots, and
              custom names you create
            </li>
          </ul>
          <p className="mt-2">
            We do not collect your name, profile picture, or any other Google
            account data beyond your email address.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">2. Why we collect it</h2>
          <p>
            Your email is used solely to link your Google account to your
            Dynasty Tree Builder account. Your dynasty data is stored so you can
            save your work and access it across sessions.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">3. Who has access</h2>
          <p>Your data is processed by the following infrastructure providers:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
            <li>
              <strong className="text-zinc-300">Supabase</strong> — authentication
              and database hosting
            </li>
            <li>
              <strong className="text-zinc-300">Vercel</strong> — application
              hosting
            </li>
          </ul>
          <p className="mt-2">
            Your data is not sold, rented, or shared with any third party beyond
            these infrastructure providers.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">4. Cookies</h2>
          <p>
            We use a single HttpOnly session cookie to keep you signed in. It is
            set by Supabase Auth and is not accessible to JavaScript. We do not
            use tracking cookies or analytics.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">5. Data retention</h2>
          <p>
            Your data is retained for as long as your account exists. You may
            request deletion of your account and all associated data at any time
            by contacting us at{" "}
            <a
              href="mailto:markus.gapaz@gmail.com"
              className="underline hover:text-zinc-100"
            >
              markus.gapaz@gmail.com
            </a>
            . Account deletion is permanent and cannot be undone.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">6. Your rights (GDPR)</h2>
          <p>
            If you are located in the European Union, you have the right to
            access, rectify, and erase your personal data. To exercise these
            rights, contact us at{" "}
            <a
              href="mailto:markus.gapaz@gmail.com"
              className="underline hover:text-zinc-100"
            >
              markus.gapaz@gmail.com
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-zinc-100">7. Contact</h2>
          <p>
            Questions about this policy:{" "}
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
    </div>
    </main>
  );
}
