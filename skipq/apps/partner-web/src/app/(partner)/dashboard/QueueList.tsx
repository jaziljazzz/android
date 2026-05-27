interface Stylist {
  id: string;
  name: string;
}

interface UserRef {
  id: string;
  name: string | null;
}

export interface QueueEntry {
  id: string;
  position: number;
  status: string;
  joined_at: string;
  started_at: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  notes: string | null;
  estimated_wait_min: number | null;
  stylists: Stylist | Stylist[] | null;
  users: UserRef | UserRef[] | null;
}

function pickOne<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function displayName(entry: QueueEntry): string {
  const user = pickOne(entry.users);
  if (user?.name) return user.name;
  return entry.guest_name ?? "Walk-in";
}

function statusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case "waiting":
      return { label: "Waiting", cls: "bg-skip-mist text-skip-slate" };
    case "arrived":
      return { label: "Arrived", cls: "bg-amber-100 text-amber-800" };
    case "serving":
      return { label: "Serving", cls: "bg-skip-accent/15 text-skip-accent" };
    default:
      return { label: status, cls: "bg-skip-mist text-skip-stone" };
  }
}

function timeSince(iso: string): string {
  const diffMin = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const h = Math.floor(diffMin / 60);
  return `${h}h ${diffMin % 60}m ago`;
}

export function QueueList({ entries }: { entries: QueueEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-skip-stone/30 bg-white p-10 text-center">
        <div className="text-skip-stone">
          When customers join the queue, they&apos;ll show up here.
        </div>
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry) => {
        const badge = statusBadge(entry.status);
        const stylist = pickOne(entry.stylists);
        return (
          <li
            key={entry.id}
            className="flex items-center gap-4 bg-white rounded-xl border border-skip-stone/15 px-4 py-3"
          >
            <div className="text-2xl font-bold text-skip-ink w-10 text-center">
              {entry.position}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-skip-ink truncate">
                  {displayName(entry)}
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded ${badge.cls}`}
                >
                  {badge.label}
                </span>
              </div>
              <div className="text-xs text-skip-stone mt-0.5">
                Joined {timeSince(entry.joined_at)}
                {stylist ? ` · w/ ${stylist.name}` : ""}
                {entry.notes ? ` · ${entry.notes}` : ""}
              </div>
            </div>
            {entry.estimated_wait_min != null ? (
              <div className="text-right">
                <div className="text-lg font-bold text-skip-ink">
                  {entry.estimated_wait_min}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-skip-stone">
                  min ETA
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
