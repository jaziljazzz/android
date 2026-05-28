import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Sidebar } from "@/components/Sidebar";
import { MobileTopBar } from "@/components/MobileTopBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export const dynamic = "force-dynamic";

async function fetchPartner() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, partner: null };

  let { data: partner } = await supabase
    .from("partner_users")
    .select("id, name, role, salon_id, salons(name, area, city)")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  // Self-heal: if no row links to this auth user, try to claim one matching
  // the email (or phone). This covers cases where the user signed in via a
  // path that didn't call link_partner_user.
  if (!partner) {
    const { error: linkErr } = await supabase.rpc("link_partner_user");
    if (!linkErr) {
      const retry = await supabase
        .from("partner_users")
        .select("id, name, role, salon_id, salons(name, area, city)")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      partner = retry.data ?? null;
    }
  }

  return { user, partner };
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
          <div className="mt-4 text-[10px] text-skip-stone/60 font-mono break-all">
            uid: {user.id}
          </div>
          <form action={signOut} className="mt-6">
            <button type="submit" className="skip-btn-primary w-full">
              Sign out
            </button>
          </form>
        </div>
      </main>
    );
  }

  const salon = Array.isArray(partner.salons) ? partner.salons[0] : partner.salons;
  const salonName = salon?.name ?? "Your salon";
  const salonArea = [salon?.area, salon?.city].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-skip-mist">
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
