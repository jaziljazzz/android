import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { MobileTopBar } from "@/components/MobileTopBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export const dynamic = "force-dynamic";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: partner } = await supabase
    .from("partner_users")
    .select("id, name, role, salon_id, salons(name, area, city)")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!partner) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-bold text-skip-ink">No salon linked to your account</h1>
          <p className="mt-2 text-skip-stone">
            You&apos;re signed in, but no SkipQ salon is provisioned to {user.email ?? "this account"} yet. Reach
            out to the SkipQ team to get set up.
          </p>
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
