import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — SkipQ",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-skip-mist">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-skip-accent font-extrabold tracking-tight">
          SkipQ
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold text-skip-ink leading-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-skip-stone">
          Effective {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="mt-8 space-y-6 text-skip-slate leading-relaxed">
          <Section title="What we collect">
            <p>
              When you create a SkipQ account we store your email, optional name, and an
              auth token issued by Supabase. When you join a queue we record the salon,
              services, and timestamps so we can show your live status and history. If you
              upload a profile photo, salon photo, reference photo, or post-service photo,
              we keep it in Supabase Storage scoped to your account.
            </p>
          </Section>

          <Section title="What we share">
            <p>
              The salon you book sees the same information they would if you walked in:
              your name, the services you picked, and a partial phone number for callbacks.
              Salons never see your email. We never sell, rent, or hand off your personal
              data to third parties for marketing.
            </p>
          </Section>

          <Section title="How we contact you">
            <p>
              We send push notifications (via OneSignal) when your queue position changes
              and the salon is ready. We do not run marketing campaigns through these
              channels. You can disable push notifications from your device settings at
              any time.
            </p>
          </Section>

          <Section title="Your controls">
            <p>
              From the Account screen you can:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Edit your name and profile photo</li>
              <li>
                Download a JSON export of everything we have on you (visits, reviews,
                style notes, favourites, referral state)
              </li>
              <li>Delete your account, which wipes your data inside 30 days</li>
            </ul>
          </Section>

          <Section title="Where the data lives">
            <p>
              Supabase ap-south-1 (Mumbai). Daily encrypted backups are kept for 7 days.
              Service workers and CDN edges may temporarily cache non-sensitive responses.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Mail{" "}
              <a href="mailto:hello@skipq.in" className="text-skip-accent font-semibold">
                hello@skipq.in
              </a>
              {" "}for any privacy or data-handling questions.
            </p>
          </Section>
        </div>

        <p className="mt-10 text-xs text-skip-stone">
          This policy is a working draft pending legal review and applies during the
          pre-launch testing period.
        </p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-skip-ink">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
