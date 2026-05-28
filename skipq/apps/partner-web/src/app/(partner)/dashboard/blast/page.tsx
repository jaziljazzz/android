import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth";
import { BlastForm } from "./BlastForm";

export const dynamic = "force-dynamic";

export default async function BlastPage() {
  const { partner } = await requirePartner();
  const supabase = createClient();

  const { data: recent } = await supabase
    .from("empty_chair_blasts")
    .select("id, message, recipient_count, sent_at")
    .order("sent_at", { ascending: false })
    .limit(5);

  const lastSent = recent?.[0] ? new Date(recent[0].sent_at) : null;
  const nextAllowed = lastSent ? new Date(lastSent.getTime() + 6 * 3600 * 1000) : null;
  const onCooldown = nextAllowed ? nextAllowed > new Date() : false;

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to queue
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">
          Empty-chair blast
        </h1>
        <p className="mt-2 text-skip-slate max-w-2xl">
          Got an idle chair? Send a one-tap push to customers who&apos;ve favourited you or
          visited in the last 60 days. One blast per six hours so it stays useful, not
          spammy.
        </p>
      </header>

      {partner.role !== "owner" ? (
        <p className="mt-10 text-sm text-skip-stone">
          Only the salon owner can send blasts.
        </p>
      ) : (
        <BlastForm onCooldown={onCooldown} nextAllowedAt={nextAllowed?.toISOString() ?? null} />
      )}

      {recent && recent.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-skip-stone">
            Recent blasts
          </h2>
          <ul className="mt-4 space-y-2">
            {recent.map((b) => (
              <li key={b.id} className="skip-card p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-skip-ink font-medium truncate">{b.message}</p>
                  <p className="text-xs text-skip-stone mt-1">
                    {new Date(b.sent_at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    · {b.recipient_count} recipient{b.recipient_count === 1 ? "" : "s"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
