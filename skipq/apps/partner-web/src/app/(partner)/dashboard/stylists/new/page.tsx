import Link from "next/link";
import { StylistForm } from "../StylistForm";

export default function NewStylistPage() {
  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard/stylists" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to stylists
      </Link>
      <header className="mt-4">
        <h1 className="text-4xl font-extrabold text-skip-ink leading-tight">Add a stylist</h1>
        <p className="mt-2 text-skip-slate">
          Who&apos;s on the floor. You can add their phone for app access later.
        </p>
      </header>

      <section className="mt-8">
        <StylistForm />
      </section>
    </main>
  );
}
