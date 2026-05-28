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

async function fetchPartner() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, partner: null as PartnerSummary | null };

  // Use a SECURITY DEFINER RPC so we don't depend on the SSR client correctly
  // propagating the auth cookie into a multi-table RLS query.
  let { data: rows } = await supabase.rpc("current_partner_full");

  // Self-heal: if no row, try to claim one matching the email/phone
  if (!rows || rows.length === 0) {
    await supabase.rpc("link_partner_user");
    const retry = await supabase.rpc("current_partner_full");
    rows = retry.data;
  }

  return { user, partner: (rows?.[0] as PartnerSummary | undefined) ?? null };
}

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
