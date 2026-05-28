import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface BranchRow {
  salon_id: string;
  salon_name: string;
  area: string | null;
  active_now: number;
  served_today: number;
  revenue_today: number | string;
  is_home: boolean;
}

export default async function BranchesPage() {
  const { partner } = await requirePartner();
  const supabase = createClient();
  const { data: rows } = await supabase.rpc("my_chain_branch_summary");
  const branches = (rows ?? []) as BranchRow[];
  const otherBranches = branches.filter((b) => !b.is_home);

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">
          Branches
        </h1>
        <p className="mt-2 text-skip-slate">
          Live snapshot across every salon in your chain.
        </p>
      </header>

      {otherBranches.length === 0 ? (
        <div className="mt-6 skip-card p-6">
          <p className="text-skip-slate">
            You only have one salon right now. Ask SkipQ support to link a sister
            location and it&apos;ll appear here.
          </p>
        </div>
      ) : null}

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {branches.map((b) => (
          <Link
            key={b.salon_id}
            href={b.is_home ? "/dashboard" : `/admin/salons/${b.salon_id}`}
            className="skip-card p-5 hover:border-skip-accent transition group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-skip-ink truncate group-hover:text-skip-accent">
                  {b.salon_name}
                </p>
                {b.area ? <p className="text-xs text-skip-stone mt-0.5">{b.area}</p> : null}
              </div>
              {b.is_home ? (
                <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-mist text-skip-slate px-2 py-1 rounded-full shrink-0">
                  Home
                </span>
              ) : null}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs uppercase tracking-wider text-skip-stone font-semibold">In queue</p>
                <p className="mt-1 text-xl font-extrabold text-skip-ink">{b.active_now}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-skip-stone font-semibold">Served</p>
                <p className="mt-1 text-xl font-extrabold text-skip-ink">{b.served_today}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-skip-stone font-semibold">Revenue</p>
                <p className="mt-1 text-xl font-extrabold text-skip-ink">
                  ₹{Number(b.revenue_today).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {partner.role === "owner" && branches.length > 1 ? (
        <p className="mt-6 text-xs text-skip-stone">
          Tap a branch to open it. Aggregate analytics will land here soon.
        </p>
      ) : null}
    </main>
  );
}
