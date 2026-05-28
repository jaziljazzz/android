import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function setFeatured(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const days = Number(formData.get("days") ?? 0);
  if (!id || !days) return;
  const supabase = createClient();
  const until = new Date();
  until.setDate(until.getDate() + days);
  await supabase.from("salons").update({ featured_until: until.toISOString() }).eq("id", id);
  redirect(`/admin/salons/${id}`);
}

async function setStatus(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (!id || !status) return;
  const supabase = createClient();
  await supabase.from("salons").update({ status }).eq("id", id);
  redirect(`/admin/salons/${id}`);
}

export default async function AdminSalonDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, tagline, type, address, area, city, state, status, rating, review_count, featured_until, joined_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!salon) notFound();

  const { data: partners } = await supabase
    .from("partner_users")
    .select("id, name, email, phone, role, auth_user_id, last_login_at")
    .eq("salon_id", salon.id)
    .order("role");

  const { count: totalEntries } = await supabase
    .from("queue_entries")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id);

  const isFeatured = salon.featured_until && new Date(salon.featured_until) > new Date();

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 sm:py-10">
      <Link href="/admin" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to all salons
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">{salon.name}</h1>
        <p className="mt-2 text-skip-slate">
          {[salon.area, salon.city, salon.state].filter(Boolean).join(", ")}
        </p>
      </header>

      <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Status" value={salon.status} />
        <Stat label="Rating" value={salon.review_count > 0 ? `${Number(salon.rating).toFixed(1)} ★` : "—"} />
        <Stat label="Reviews" value={String(salon.review_count)} />
        <Stat label="All-time queues" value={String(totalEntries ?? 0)} />
      </section>

      <section className="mt-8 skip-card p-5">
        <h2 className="text-lg font-bold text-skip-ink">Featured slot</h2>
        <p className="text-sm text-skip-slate mt-1">
          {isFeatured
            ? `Featured until ${new Date(salon.featured_until!).toLocaleString("en-IN")}`
            : "Not featured. Customers see them in the default rank."}
        </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {[7, 14, 30].map((d) => (
            <form key={d} action={setFeatured}>
              <input type="hidden" name="id" value={salon.id} />
              <input type="hidden" name="days" value={d} />
              <button type="submit" className="skip-btn-ghost text-sm py-2">
                Feature for {d} days
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="mt-6 skip-card p-5">
        <h2 className="text-lg font-bold text-skip-ink">Status</h2>
        <div className="mt-3 flex gap-2">
          {["active", "pending", "suspended"].map((s) => (
            <form key={s} action={setStatus}>
              <input type="hidden" name="id" value={salon.id} />
              <input type="hidden" name="status" value={s} />
              <button
                type="submit"
                disabled={salon.status === s}
                className={`text-sm py-2 px-4 rounded-xl font-semibold transition ${
                  salon.status === s
                    ? "bg-skip-mist text-skip-stone cursor-not-allowed"
                    : "bg-white border border-skip-stone/20 text-skip-ink hover:border-skip-accent"
                }`}
              >
                {s}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="mt-6 skip-card p-5">
        <h2 className="text-lg font-bold text-skip-ink">Partners</h2>
        <ul className="mt-3 space-y-2">
          {(partners ?? []).map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2 border-t border-skip-stone/10 first:border-t-0">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-skip-ink">
                  {p.name}{" "}
                  <span className="text-xs font-normal text-skip-stone uppercase tracking-wider">{p.role}</span>
                </div>
                <div className="text-xs text-skip-slate">{p.email ?? p.phone ?? "—"}</div>
              </div>
              <div className="text-xs text-skip-stone">
                {p.auth_user_id ? (p.last_login_at ? `last seen ${new Date(p.last_login_at).toLocaleDateString("en-IN")}` : "linked") : "not signed in yet"}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="skip-card p-4">
      <div className="text-xl font-extrabold text-skip-ink capitalize">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-skip-stone font-bold mt-1">{label}</div>
    </div>
  );
}
