export const metadata = { title: "Help & support — SkipQ" };

export default function HelpPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <h1 className="text-2xl font-extrabold text-skip-ink">Help & support</h1>
      <p className="mt-2 text-skip-slate text-sm">
        Pre-launch testing — most of these flows are still being polished.
      </p>

      <section className="mt-6 space-y-3">
        <FAQ q="How do I join a queue?">
          Tap a salon → pick services → tap Skip the queue. You&apos;ll be asked to sign in if
          you haven&apos;t already.
        </FAQ>
        <FAQ q="Can I cancel a booking?">
          Yes — open the Bookings tab and tap Leave queue. You can leave any time before
          your turn.
        </FAQ>
        <FAQ q="What if I don&apos;t show up?">
          After 3 no-shows in 30 days you&apos;ll be asked for a small deposit to confirm
          future bookings.
        </FAQ>
        <FAQ q="Where can I reach support?">
          Drop a mail to{" "}
          <a href="mailto:hello@skipq.in" className="text-skip-accent font-semibold">
            hello@skipq.in
          </a>{" "}
          and we&apos;ll get back within 24 hours.
        </FAQ>
      </section>
    </main>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="skip-card p-4">
      <summary className="font-semibold text-skip-ink cursor-pointer list-none flex items-center justify-between">
        <span>{q}</span>
        <span className="text-skip-stone text-xl leading-none">+</span>
      </summary>
      <div className="mt-2 text-sm text-skip-slate">{children}</div>
    </details>
  );
}
