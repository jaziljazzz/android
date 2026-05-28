import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function resolve(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const resolution = ((formData.get("resolution") as string) ?? "").trim();
  const refund = formData.get("refund") === "true";
  if (!id) return;
  const supabase = createClient();
  await supabase.rpc("resolve_dispute", {
    p_dispute_id: id,
    p_resolution: resolution || (refund ? "Refunded" : "Rejected"),
    p_refund: refund,
  });
  redirect("/admin/disputes");
}

export default async function AdminDisputesPage() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("disputes")
    .select(
      `id, reason, status, resolution, created_at, resolved_at,
       queue_entry_id, salon_id,
       salons ( name, area ),
       users  ( name, email, phone )`,
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

  const open = rows?.filter((r) => r.status === "open").length ?? 0;

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 sm:py-10">
      <Link href="/admin" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to admin
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Disputes</h1>
        <p className="mt-2 text-skip-slate">
          {open} open · {((rows?.length ?? 0) - open)} resolved (last 100)
        </p>
      </header>

      <ul className="mt-6 space-y-3">
        {(rows ?? []).map((d) => {
          const salon = Array.isArray(d.salons) ? d.salons[0] : d.salons;
          const user = Array.isArray(d.users) ? d.users[0] : d.users;
          const isOpen = d.status === "open";
          return (
            <li key={d.id} className="skip-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      d.status === "open" ? "bg-skip-cautionLo text-skip-caution" :
                      d.status === "refunded" ? "bg-skip-successLo text-skip-success" :
                      "bg-skip-mist text-skip-stone"
                    }`}>{d.status}</span>
                    <Link
                      href={`/admin/salons/${d.salon_id}`}
                      className="font-semibold text-skip-ink hover:text-skip-accent"
                    >
                      {salon?.name ?? "Salon"}
                    </Link>
                    {user?.name ? (
                      <span className="text-skip-stone text-sm">vs {user.name}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-skip-ink">{d.reason}</p>
                  {d.resolution ? (
                    <p className="mt-2 text-xs text-skip-stone italic">Resolution: {d.resolution}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-skip-stone">
                    Filed {new Date(d.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>

              {isOpen ? (
                <form action={resolve} className="mt-3 pt-3 border-t border-skip-stone/10 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={d.id} />
                  <input
                    name="resolution"
                    placeholder="Note (shown to customer)"
                    className="flex-1 min-w-[200px] text-sm py-2 px-3 rounded-xl bg-white border border-skip-stone/20"
                  />
                  <button type="submit" name="refund" value="true" className="skip-btn-primary text-sm py-2">
                    Approve refund
                  </button>
                  <button type="submit" name="refund" value="false" className="skip-btn-ghost text-sm py-2">
                    Reject
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
        {!rows?.length ? (
          <p className="text-skip-stone text-sm">No disputes filed yet.</p>
        ) : null}
      </ul>
    </main>
  );
}
