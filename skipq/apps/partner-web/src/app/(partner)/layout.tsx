import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Sidebar } from "@/components/Sidebar";
import { MobileTopBar } from "@/components/MobileTopBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";

export const dynamic = "force-dynamic";

interface PartnerSummary {
  partner_id: string;
  name: string;
  role: string;
  salon_id: string;
  salon_name: string | null;
  salon_area: string | null;
  salon_city: string | null;
}

interface BundleRow {
  user_id: string | null;
  user_email: string | null;
  partner_id: string | null;
  name: string | null;
  role: string | null;
  salon_id: string | null;
  salon_name: string | null;
  salon_area: string | null;
  salon_city: string | null;
}

// Memoise across the request render tree so layout + child pages don't
// duplicate the lookup. One RPC round-trip on the happy path.
const fetchPartner = cache(async function fetchPartner() {
  const supabase = createClient();
  const sb = supabase as unknown as {
    rpc: (
      fn: string,
      args?: Record<string, unknown>,
    ) => Promise<{ data: BundleRow[] | null }>;
  };

  const { data: rows } = await sb.rpc("partner_layout_bundle");
  const row = rows?.[0];

  if (row?.user_id) {
    const partner: PartnerSummary | null = row.partner_id
      ? {
          partner_id: row.partner_id,
          name: row.name ?? "",
          role: row.role ?? "",
          salon_id: row.salon_id ?? "",
          salon_name: row.salon_name,
          salon_area: row.salon_area,
          salon_city: row.salon_city,
        }
      : null;

    if (partner) {
      return {
        user: { id: row.user_id, email: row.user_email ?? "" },
        partner,
      };
    }

    // User exists but no partner row — attempt self-heal once.
    await supabase.rpc("link_partner_user");
    const { data: retryRows } = await sb.rpc("partner_layout_bundle");
    const retry = retryRows?.[0];
    return {
      user: { id: row.user_id, email: row.user_email ?? "" },
      partner: retry?.partner_id
        ? {
            partner_id: retry.partner_id,
            name: retry.name ?? "",
            role: retry.role ?? "",
            salon_id: retry.salon_id ?? "",
            salon_name: retry.salon_name,
            salon_area: retry.salon_area,
            salon_city: retry.salon_city,
          }
        : null,
    };
  }

  return { user: null, partner: null as PartnerSummary | null };
});

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, partner } = await fetchPartner();
  if (!user) redirect("/login");

  if (!partner) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-extrabold text-skip-ink">No salon linked to your account</h1>
          <p className="mt-3 text-skip-slate">
            You&apos;re signed in as{" "}
            <span className="font-semibold text-skip-ink">{user.email ?? "this account"}</span>,
            but no SkipQ salon is provisioned to it yet.
          </p>
          <p className="mt-2 text-skip-stone text-sm">
            If you signed up with a different email previously, sign out and try again.
          </p>
          <form action={signOut} className="mt-6">
            <button type="submit" className="skip-btn-primary w-full">
              Sign out
            </button>
          </form>
        </div>
      </main>
    );
  }

  const salonName = partner.salon_name ?? "Your salon";
  const salonArea = [partner.salon_area, partner.salon_city].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-skip-mist">
      <OfflineBanner />
      <MobileTopBar salonName={salonName} salonArea={salonArea} />

      <div className="hidden lg:block">
        <Sidebar
          salonName={salonName}
          salonArea={salonArea}
          partnerName={partner.name}
          partnerRole={partner.role}
        />
      </div>

      <div className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</div>

      <MobileBottomNav />
    </div>
  );
}
