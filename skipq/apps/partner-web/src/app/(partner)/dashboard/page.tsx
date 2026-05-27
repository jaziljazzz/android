import { createClient } from "@/lib/supabase/server";
import { QueueList } from "./QueueList";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const supabase = createClient();

  // RLS scopes this to the partner's salon automatically.
  const { data: entries, error } = await supabase
    .from("queue_entries")
    .select(
      `
        id,
        position,
        status,
        joined_at,
        started_at,
        guest_name,
        guest_phone,
        notes,
        estimated_wait_min,
        stylists!queue_entries_stylist_id_fkey ( id, name ),
        users    ( id, name )
      `,
    )
    .in("status", ["waiting", "arrived", "serving"])
    .order("position", { ascending: true });

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-skip-ink">Live queue</h1>
        <p className="mt-4 text-red-600">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-4xl">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-skip-ink">Live queue</h1>
          <p className="mt-1 text-skip-stone text-sm">
            {entries.length === 0
              ? "Nobody's waiting right now."
              : `${entries.length} in queue.`}
          </p>
        </div>
      </header>

      <section className="mt-6">
        <QueueList entries={entries} />
      </section>
    </main>
  );
}
