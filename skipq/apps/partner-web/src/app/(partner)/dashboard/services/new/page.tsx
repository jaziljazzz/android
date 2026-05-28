import Link from "next/link";
import { ServiceForm } from "../ServiceForm";

export default function NewServicePage() {
  return (
    <main className="p-8 max-w-4xl">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-skip-ink">Add a service</h1>
          <p className="mt-1 text-skip-stone text-sm">
            Price + default duration. The algorithm learns the actual times as you complete services.
          </p>
        </div>
        <Link href="/dashboard/services" className="text-sm text-skip-stone hover:text-skip-ink">
          ← Back
        </Link>
      </header>

      <section className="mt-6">
        <ServiceForm />
      </section>
    </main>
  );
}
