import Link from "next/link";
import { StylistForm } from "../StylistForm";

export default function NewStylistPage() {
  return (
    <main className="p-8 max-w-4xl">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-skip-ink">Add a stylist</h1>
          <p className="mt-1 text-skip-stone text-sm">
            Who&apos;s on the floor. You can add their phone for app access later.
          </p>
        </div>
        <Link href="/dashboard/stylists" className="text-sm text-skip-stone hover:text-skip-ink">
          ← Back
        </Link>
      </header>

      <section className="mt-6">
        <StylistForm />
      </section>
    </main>
  );
}
