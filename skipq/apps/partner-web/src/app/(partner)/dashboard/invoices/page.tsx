import { createClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  pending: { label: "Due", cls: "bg-skip-cautionLo text-skip-caution" },
  paid: { label: "Paid", cls: "bg-skip-successLo text-skip-success" },
  disputed: { label: "Disputed", cls: "bg-skip-accentLo text-skip-accent" },
  overdue: { label: "Overdue", cls: "bg-skip-accentLo text-skip-accent" },
};

export default async function InvoicesPage() {
  const { partner } = await requirePartner();
  const supabase = createClient();

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, period_start, period_end, new_customer_count, lead_fee_amount, commission_amount, ad_amount, total_amount, status, issued_at, due_at, paid_at, razorpay_link")
    .eq("salon_id", partner.salon_id)
    .order("issued_at", { ascending: false });

  const pending = (invoices ?? []).filter((i) => i.status === "pending");
  const pendingTotal = pending.reduce((acc, i) => acc + Number(i.total_amount), 0);

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Invoices</h1>
        <p className="mt-2 text-skip-slate">
          ₹50 per <span className="font-semibold">new</span> customer SkipQ brought to your salon. Issued every Monday for the previous week.
        </p>
      </header>

      {pendingTotal > 0 ? (
        <div className="mt-6 skip-card p-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wider text-skip-stone font-bold">Pending balance</div>
            <div className="text-3xl font-extrabold text-skip-ink mt-1">
              ₹{pendingTotal.toFixed(0)}
            </div>
            <div className="text-xs text-skip-stone mt-1">
              {pending.length} invoice{pending.length === 1 ? "" : "s"} awaiting payment
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-6 text-skip-accent">{error.message}</p>
      ) : invoices && invoices.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {invoices.map((i) => {
            const badge = STATUS_STYLES[i.status] ?? STATUS_STYLES.pending!;
            return (
              <li key={i.id} className="skip-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-skip-ink">
                    {new Date(i.period_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {" → "}
                    {new Date(i.period_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div className="text-xs text-skip-slate mt-0.5">
                    {i.new_customer_count} new customer{i.new_customer_count === 1 ? "" : "s"} × ₹50 lead fee
                    {Number(i.commission_amount) > 0 ? ` + ₹${Number(i.commission_amount).toFixed(0)} commission` : ""}
                    {Number(i.ad_amount) > 0 ? ` + ₹${Number(i.ad_amount).toFixed(0)} ads` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-skip-ink">
                    ₹{Number(i.total_amount).toFixed(0)}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                {i.razorpay_link && i.status === "pending" ? (
                  <a
                    href={i.razorpay_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="skip-btn-primary text-sm py-2 px-3"
                  >
                    Pay now
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 skip-card p-12 text-center">
          <h2 className="text-xl font-bold text-skip-ink">No invoices yet</h2>
          <p className="mt-1 text-skip-slate">
            Your first invoice runs at the end of the week. You only pay when SkipQ brings new customers.
          </p>
        </div>
      )}

      <p className="mt-10 text-xs text-skip-stone">
        Lead fees apply only to customers who&apos;ve never visited your salon before. Repeat customers
        and your existing base are free. Invoices issue every Monday at 03:30 IST.
      </p>
    </main>
  );
}
