import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const { partner } = await requirePartner();
  if (partner.role !== "owner") {
    redirect("/dashboard/profile");
  }

  const supabase = createClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("name, tagline, type, address, area, city, state, phone, email, status, upi_id, gst_number")
    .eq("id", partner.salon_id)
    .single();

  if (!salon) redirect("/dashboard/profile");

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard/profile" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to profile
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Edit salon profile</h1>
        <p className="mt-2 text-skip-slate">
          What customers see when they tap your salon on SkipQ.
        </p>
      </header>

      <section className="mt-8">
        <ProfileForm initial={salon} />
      </section>
    </main>
  );
}
