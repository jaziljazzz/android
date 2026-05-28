import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadPhotoButton } from "./UploadPhotoButton";

export const dynamic = "force-dynamic";

const SLOTS = [
  { value: "home_hero", label: "Home — Hero carousel" },
  { value: "home_video", label: "Home — Video roadblock" },
  { value: "home_strip", label: "Home — Product strip" },
  { value: "salon_detail", label: "Salon detail page" },
];

const SEGMENTS = [
  { value: "all", label: "Everyone" },
  { value: "mens", label: "Men's services" },
  { value: "ladies", label: "Ladies services" },
  { value: "beard", label: "Beard services" },
  { value: "colour", label: "Hair colour services" },
  { value: "plus", label: "Plus members" },
  { value: "new", label: "First-time customers" },
];

interface PlacementRow {
  id: string;
  brand_name: string;
  campaign_name: string;
  slot: string;
  copy_title: string;
  media_url: string;
  media_type: string;
  bg_color: string;
  accent_color: string;
  target_city: string | null;
  target_segment: string;
  starts_at: string;
  ends_at: string;
  cpm_rupees: number;
  impressions: number;
  clicks: number;
  rank: number;
  active: boolean;
}

async function createPlacement(formData: FormData) {
  "use server";
  const supabase = createClient();
  const get = (k: string) => (formData.get(k) as string | null)?.trim() ?? "";
  const brand_name = get("brand_name");
  const campaign_name = get("campaign_name");
  const slot = get("slot");
  const copy_title = get("copy_title");
  const media_url = get("media_url");
  if (!brand_name || !campaign_name || !slot || !copy_title || !media_url) {
    return;
  }
  const days = Math.max(1, Math.min(365, Number(formData.get("days") ?? 30)));
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + days);

  const row = {
    brand_name,
    campaign_name,
    slot,
    copy_eyebrow: get("copy_eyebrow") || null,
    copy_title,
    copy_subtitle: get("copy_subtitle") || null,
    media_url,
    media_poster_url: get("media_poster_url") || null,
    media_type: get("media_type") || "image",
    bg_color: get("bg_color") || "#0b1f3a",
    fg_color: get("fg_color") || "#ffffff",
    accent_color: get("accent_color") || "#ffd400",
    cta_label: get("cta_label") || "Learn more",
    cta_url: get("cta_url") || null,
    target_city: get("target_city") || null,
    target_segment: get("target_segment") || "all",
    cpm_rupees: Number(formData.get("cpm_rupees") ?? 0) || 0,
    rank: Number(formData.get("rank") ?? 50) || 50,
    ends_at: endsAt.toISOString(),
    active: true,
  };

  const sb = supabase as unknown as {
    from: (t: string) => {
      insert: (row: unknown) => Promise<{ error: unknown }>;
    };
  };
  await sb.from("sponsored_placements").insert(row);
  redirect("/admin/placements");
}

async function toggleActive(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const active = formData.get("active") === "true";
  if (!id) return;
  const supabase = createClient();
  const sb = supabase as unknown as {
    from: (t: string) => {
      update: (patch: Record<string, unknown>) => {
        eq: (col: string, v: string) => Promise<unknown>;
      };
    };
  };
  await sb.from("sponsored_placements").update({ active: !active }).eq("id", id);
  redirect("/admin/placements");
}

async function deletePlacement(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = createClient();
  const sb = supabase as unknown as {
    from: (t: string) => {
      delete: () => { eq: (col: string, v: string) => Promise<unknown> };
    };
  };
  await sb.from("sponsored_placements").delete().eq("id", id);
  redirect("/admin/placements");
}

async function clearPlacementMedia(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = createClient();
  const sb = supabase as unknown as {
    from: (t: string) => {
      update: (patch: Record<string, unknown>) => {
        eq: (col: string, v: string) => Promise<unknown>;
      };
    };
  };
  await sb
    .from("sponsored_placements")
    .update({ media_url: "" })
    .eq("id", id);
  redirect("/admin/placements");
}

async function uploadPlacementMedia(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const file = formData.get("file") as File | null;
  if (!id || !file || file.size === 0) return;

  const supabase = createClient();
  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const key = `placements/${id}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const sbStorage = supabase as unknown as {
    storage: {
      from: (b: string) => {
        upload: (
          p: string,
          body: Buffer,
          opts?: { contentType?: string; upsert?: boolean },
        ) => Promise<{ error: { message: string } | null }>;
        getPublicUrl: (p: string) => { data: { publicUrl: string } };
      };
    };
  };

  const up = await sbStorage.storage.from("brand-assets").upload(key, buf, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (up.error) return;

  const { data: pub } = sbStorage.storage.from("brand-assets").getPublicUrl(key);

  const sbDb = supabase as unknown as {
    from: (t: string) => {
      update: (patch: Record<string, unknown>) => {
        eq: (col: string, v: string) => Promise<unknown>;
      };
    };
  };
  await sbDb
    .from("sponsored_placements")
    .update({ media_url: pub.publicUrl })
    .eq("id", id);
  redirect("/admin/placements");
}

export default async function PlacementsAdmin() {
  const supabase = createClient();
  const sb = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        order: (
          col: string,
          opt: { ascending: boolean },
        ) => {
          limit: (n: number) => Promise<{ data: PlacementRow[] | null }>;
        };
      };
    };
  };
  const { data: rowsRaw } = await sb
    .from("sponsored_placements")
    .select(
      "id, brand_name, campaign_name, slot, copy_title, media_url, media_type, bg_color, accent_color, target_city, target_segment, starts_at, ends_at, cpm_rupees, impressions, clicks, rank, active",
    )
    .order("rank", { ascending: false })
    .limit(200);
  const rows = (rowsRaw ?? []) as PlacementRow[];

  const grouped = rows.reduce<Record<string, PlacementRow[]>>((acc, r) => {
    (acc[r.slot] ||= []).push(r);
    return acc;
  }, {});

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <Link
        href="/admin"
        className="text-sm font-medium text-skip-slate hover:text-skip-ink"
      >
        ← Back to admin
      </Link>
      <header className="mt-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-skip-ink leading-tight">
          Sponsored placements
        </h1>
        <p className="mt-1 text-sm text-skip-slate">
          Brand ad inventory across the customer app.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:gap-6">
          <Stat label="Live" value={rows.filter((r) => r.active).length} />
          <Stat
            label="Impressions"
            value={rows.reduce((s, r) => s + (r.impressions ?? 0), 0).toLocaleString()}
          />
          <Stat
            label="Clicks"
            value={rows.reduce((s, r) => s + (r.clicks ?? 0), 0).toLocaleString()}
          />
        </div>
      </header>

      <details className="mt-5 skip-card overflow-hidden">
        <summary className="p-4 cursor-pointer list-none flex items-center justify-between font-bold text-skip-ink">
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-skip-accent text-white flex items-center justify-center text-base font-bold">
              +
            </span>
            New campaign
          </span>
          <span className="text-xs font-medium text-skip-stone">Tap to expand</span>
        </summary>
        <form
          action={createPlacement}
          className="px-4 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <Field label="Brand name" name="brand_name" required placeholder="Bath & Body Works" />
          <Field label="Campaign name" name="campaign_name" required placeholder="Signature Scents Spring" />

          <label className="block">
            <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
              Slot
            </span>
            <select name="slot" required defaultValue="home_hero" className="skip-input mt-1">
              {SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
              Media type
            </span>
            <select name="media_type" defaultValue="image" className="skip-input mt-1">
              <option value="image">Image</option>
              <option value="video">Video (MP4)</option>
            </select>
          </label>

          <Field
            label="Eyebrow (small caps line)"
            name="copy_eyebrow"
            placeholder="BATH & BODY WORKS"
          />
          <Field
            label="CTA label"
            name="cta_label"
            placeholder="Find a salon"
          />

          <Field label="Headline" name="copy_title" required full placeholder="Wrapped in fragrance, all day" />
          <Field
            label="Subtitle"
            name="copy_subtitle"
            full
            placeholder="Signature scent mists now at select premium salons. Try one free."
          />

          <Field
            label="Media URL (image / video)"
            name="media_url"
            type="url"
            required
            full
            placeholder="https://…/banner.jpg or https://…/film.mp4"
          />
          <Field
            label="Video poster URL (video only)"
            name="media_poster_url"
            type="url"
            full
            placeholder="https://…/poster.jpg"
          />

          <ColorField label="Background" name="bg_color" defaultValue="#0b1f3a" />
          <ColorField label="Foreground (text)" name="fg_color" defaultValue="#ffffff" />
          <ColorField label="Accent (CTA pill)" name="accent_color" defaultValue="#ffd400" />
          <Field
            label="CTA URL"
            name="cta_url"
            type="url"
            placeholder="/c/home or https://…/redeem"
          />

          <label className="block">
            <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
              Target segment
            </span>
            <select name="target_segment" defaultValue="all" className="skip-input mt-1">
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <Field label="Target city (optional)" name="target_city" placeholder="Bengaluru" />

          <Field
            label="CPM (₹ per 1000 impressions)"
            name="cpm_rupees"
            type="number"
            defaultValue="200"
          />
          <Field
            label="Rank (higher shows first)"
            name="rank"
            type="number"
            defaultValue="50"
          />
          <Field
            label="Duration (days)"
            name="days"
            type="number"
            defaultValue="30"
          />

          <div className="sm:col-span-2 pt-2">
            <button type="submit" className="skip-btn-primary w-full sm:w-auto">
              Launch campaign
            </button>
          </div>
        </form>
      </details>

      {SLOTS.map((s) => {
        const list = grouped[s.value] ?? [];
        if (!list.length) return null;
        return (
          <section key={s.value} className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-skip-stone">
              {s.label}
            </h2>
            <div className="mt-3 space-y-2">
              {list.map((p) => {
                const live =
                  p.active &&
                  new Date(p.starts_at) <= new Date() &&
                  new Date(p.ends_at) > new Date();
                const ctr = p.impressions
                  ? ((p.clicks / p.impressions) * 100).toFixed(2)
                  : "0.00";
                const revenue = Math.round(
                  (Number(p.cpm_rupees ?? 0) * (p.impressions ?? 0)) / 1000,
                );
                const hasPhoto = Boolean(p.media_url);
                return (
                  <div key={p.id} className="skip-card overflow-hidden">
                    <div className="flex gap-3 p-3">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-black/5">
                        {hasPhoto ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.media_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <form
                              action={clearPlacementMedia}
                              className="absolute top-1 right-1"
                            >
                              <input type="hidden" name="id" value={p.id} />
                              <button
                                type="submit"
                                aria-label="Remove photo"
                                title="Remove photo"
                                className="w-6 h-6 rounded-full bg-black/70 text-white text-xs font-bold flex items-center justify-center active:scale-95 hover:bg-black"
                              >
                                ×
                              </button>
                            </form>
                          </>
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-wider font-bold"
                            style={{
                              background: `linear-gradient(135deg, ${p.bg_color}, ${p.accent_color})`,
                              color: p.bg_color === "#ffffff" ? "#000" : "#fff",
                            }}
                          >
                            No photo
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-skip-ink text-sm">
                            {p.brand_name}
                          </span>
                          {live ? (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-skip-successLo text-skip-success px-1.5 py-0.5 rounded">
                              Live
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-skip-mist text-skip-stone px-1.5 py-0.5 rounded">
                              Paused
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-skip-stone truncate">
                          {p.campaign_name}
                        </p>
                        <p className="mt-1 text-[13px] font-medium text-skip-slate line-clamp-2 leading-snug">
                          {p.copy_title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-skip-mist text-skip-slate px-1.5 py-0.5 rounded">
                            {p.target_segment}
                          </span>
                          {p.target_city ? (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-skip-mist text-skip-slate px-1.5 py-0.5 rounded">
                              {p.target_city}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="px-3 pb-2 text-[11px] text-skip-stone flex items-center gap-3 flex-wrap">
                      <span>{(p.impressions ?? 0).toLocaleString()} views</span>
                      <span>·</span>
                      <span>{(p.clicks ?? 0).toLocaleString()} clicks</span>
                      <span>·</span>
                      <span>{ctr}% CTR</span>
                      <span>·</span>
                      <span>₹{revenue.toLocaleString()}</span>
                      <span>·</span>
                      <span>
                        ends{" "}
                        {new Date(p.ends_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 border-t border-skip-stone/10 divide-x divide-skip-stone/10">
                      <form
                        action={uploadPlacementMedia}
                        encType="multipart/form-data"
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <UploadPhotoButton
                          label={hasPhoto ? "Replace" : "Upload"}
                        />
                      </form>
                      <form action={toggleActive}>
                        <input type="hidden" name="id" value={p.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={String(p.active)}
                        />
                        <button
                          type="submit"
                          className="w-full py-2.5 text-sm font-semibold text-skip-slate hover:bg-skip-mist active:bg-skip-mist"
                        >
                          {p.active ? "Pause" : "Resume"}
                        </button>
                      </form>
                      <form action={deletePlacement}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="w-full py-2.5 text-sm font-semibold text-skip-accent hover:bg-skip-accentLo active:bg-skip-accentLo"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {!rows.length ? (
        <p className="mt-8 text-skip-stone text-sm">
          No placements yet. Create the first campaign above.
        </p>
      ) : null}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-right">
      <div className="text-lg font-extrabold text-skip-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-semibold">
        {label}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  full,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  full?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="skip-input mt-1"
      />
    </label>
  );
}

function ColorField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
        {label}
      </span>
      <div className="mt-1 flex items-center gap-2">
        <input
          name={name}
          type="color"
          defaultValue={defaultValue}
          className="h-10 w-12 rounded-md border border-skip-stone/25 bg-white cursor-pointer"
        />
        <input
          name={`${name}_text`}
          defaultValue={defaultValue}
          readOnly
          className="skip-input flex-1 font-mono text-sm"
        />
      </div>
    </label>
  );
}
