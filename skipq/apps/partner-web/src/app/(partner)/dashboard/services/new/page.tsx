import Link from "next/link";
import { ServiceForm } from "../ServiceForm";

export default function NewServicePage() {
  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard/services" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to services
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Add a service</h1>
        <p className="mt-2 text-skip-slate">
          Price + default duration. The algorithm learns the actual times as you complete services.
        </p>
      </header>

      <section className="mt-8">
        <ServiceForm />
      </section>
    </main>
  );
}
