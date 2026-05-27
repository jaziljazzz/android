import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The partner_user row was claimed by link_partner_user() during sign-in.
  // If it's missing here, the user authenticated but isn't provisioned.
  const { data: partner } = await supabase
    .from("partner_users")
    .select("id, name, role, salon_id, salons(name, area, city)")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!partner) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-bold text-skip-ink">No salon linked to this number</h1>
          <p className="mt-2 text-skip-stone">
            Your phone is signed in, but no skipQ salon is provisioned to it yet. Reach
            out to the skipQ team to get set up.
          </p>
        </div>
      </main>
    );
  }

  const salon = Array.isArray(partner.salons) ? partner.salons[0] : partner.salons;

  return (
    <div className="min-h-screen flex bg-skip-mist">
      <Sidebar
        salonName={salon?.name ?? "Your salon"}
        salonArea={[salon?.area, salon?.city].filter(Boolean).join(", ")}
        partnerName={partner.name}
        partnerRole={partner.role}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
