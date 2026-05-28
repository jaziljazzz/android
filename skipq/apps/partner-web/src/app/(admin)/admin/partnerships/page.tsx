import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function createPartnership(formData: FormData) {
  "use server";
  const supabase = createClient();
  const brand_name = (formData.get("brand_name") as string ?? "").trim();
  const perk_text = (formData.get("perk_text") as string ?? "").trim();
  const cta_url = (formData.get("cta_url") as string ?? "").trim() || null;
  const logo_url = (formData.get("logo_url") as string ?? "").trim() || null;
  const audience = (formData.get("audience") as string ?? "everyone");
  const days = Number(formData.get("days") ?? 14);
  if (!brand_name || !perk_text) return;
  const endAt = new Date();
  endAt.setDate(endAt.getDate() + Math.max(1, days));
  await supabase.from("brand_partnerships").insert({
    brand_name,
    perk_text,
    cta_url,
    logo_url,
    audience,
    end_at: endAt.toISOString(),
  });
  redirect("/admin/partnerships");
}

async function toggleActive(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const active = formData.get("active") === "true";
  if (!id) return;
  const supabase = createClient();
  await supabase.from("brand_partnerships").update({ active: !active }).eq("id", id);
  redirect("/admin/partnerships");
}

export default async function PartnershipsPage() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("brand_partnerships")
    .select("id, brand_name, perk_text, cta_url, logo_url, audience, start_at, end_at, active")
    .order("start_at", { ascending: false })
    .limit(50);

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 sm:py-10">
      <Link href="/admin" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to admin
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">
          Brand partnerships
        </h1>
        <p className="mt-2 text-skip-slate">
          Sponsored banners shown on the customer home above the salon list.
        </p>
      </header>

      <section className="mt-6 skip-card p-5">
        <h2 className="text-lg font-bold text-skip-ink">New partnership</h2>
        <form action={createPartnership} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Brand name</span>
            <input name="brand_name" required className="skip-input mt-1" placeholder="Park Avenue" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Audience</span>
            <select name="audience" defaultValue="everyone" className="skip-input mt-1">
              <option value="everyone">Everyone</option>
              <option value="plus_users">Plus members</option>
              <option value="new_users">First-time customers</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Perk copy</span>
            <input name="perk_text" required className="skip-input mt-1" placeholder="Get a free aftershave at any SkipQ salon" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Logo URL (optional)</span>
            <input name="logo_url" type="url" className="skip-input mt-1" placeholder="https://…/logo.png" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">CTA URL (optional)</span>
            <input name="cta_url" type="url" className="skip-input mt-1" placeholder="https://…/redeem" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Duration (days)</span>
            <input name="days" type="number" defaultValue={14} min={1} max={365} className="skip-input mt-1" />
          </label>
          <div className="sm:col-span-2 pt-2">
            <button type="submit" className="skip-btn-primary">Launch banner</button>
          </div>
        </form>
      </section>

      <section className="mt-6 space-y-2">
        {(rows ?? []).map((p) => {
          const live = p.active && new Date(p.start_at) <= new Date() && new Date(p.end_at) > new Date();
          return (
            <div key={p.id} className="skip-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-skip-ink">{p.brand_name}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-mist text-skip-slate px-2 py-0.5 rounded-full">
                    {p.audience}
                  </span>
                  {live ? (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-successLo text-skip-success px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-mist text-skip-stone px-2 py-0.5 rounded-full">
                      Paused
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-skip-slate truncate">{p.perk_text}</p>
                <p className="mt-1 text-xs text-skip-stone">
                  {new Date(p.start_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" — "}
                  {new Date(p.end_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <form action={toggleActive}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="active" value={String(p.active)} />
                <button type="submit" className="skip-btn-ghost text-sm py-2">
                  {p.active ? "Pause" : "Resume"}
                </button>
              </form>
            </div>
          );
        })}
        {!rows?.length ? (
          <p className="text-skip-stone text-sm">No partnerships yet.</p>
        ) : null}
      </section>
    </main>
  );
}
