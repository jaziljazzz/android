import Link from "next/link";
import { StylistForm } from "../StylistForm";
import { requirePartner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewStylistPage() {
  const { partner } = await requirePartner();
  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard/stylists" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to stylists
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Add a stylist</h1>
        <p className="mt-2 text-skip-slate">
          Who&apos;s on the floor. You can add their phone for app access later.
        </p>
      </header>

      <section className="mt-8">
        <StylistForm salonId={partner.salon_id} />
      </section>
    </main>
  );
}
