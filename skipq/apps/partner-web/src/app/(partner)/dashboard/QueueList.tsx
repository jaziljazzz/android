import {
  cancelEntry,
  completeService,
  markArrived,
  markNoShow,
  reassignStylist,
  startService,
} from "./actions";

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
      return { label: "Arrived", cls: "bg-skip-cautionLo text-skip-caution" };
    case "serving":
      return { label: "Now serving", cls: "bg-skip-successLo text-skip-success" };
    default:
      return { label: status, cls: "bg-skip-mist text-skip-stone" };
  }
}

function positionChipClass(status: string): string {
  switch (status) {
    case "serving":
      return "bg-skip-success text-white";
    case "arrived":
      return "bg-skip-caution text-white";
    default:
      return "bg-skip-ink text-white";
  }
}

function timeSince(iso: string): string {
  const diffMin = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const h = Math.floor(diffMin / 60);
  return `${h}h ${diffMin % 60}m ago`;
}

function ActionButtons({
  entry,
  stylists,
}: {
  entry: QueueEntry;
  stylists: Stylist[];
}) {
  const current = pickOne(entry.stylists);
  const canReassign = (entry.status === "arrived" || entry.status === "serving") && stylists.length > 0;
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {entry.status === "waiting" ? (
        <>
          <FormButton id={entry.id} action={markArrived} label="Mark arrived" primary />
          <FormButton id={entry.id} action={cancelEntry} label="Cancel" subtle />
        </>
      ) : null}
      {entry.status === "arrived" ? (
        <>
          <FormButton id={entry.id} action={startService} label="Start service" primary />
          <FormButton id={entry.id} action={markNoShow} label="No-show" subtle />
        </>
      ) : null}
      {entry.status === "serving" ? (
        <FormButton id={entry.id} action={completeService} label="Mark complete" primary />
      ) : null}
      {canReassign ? (
        <form action={reassignStylist} className="flex items-center gap-1">
          <input type="hidden" name="id" value={entry.id} />
          <select
            name="stylist_id"
            defaultValue=""
            className="rounded-xl text-xs font-semibold bg-skip-mist text-skip-slate px-2 py-2 border-none"
            aria-label="Reassign stylist"
          >
            <option value="" disabled>
              Reassign…
            </option>
            {stylists
              .filter((s) => !current || s.id !== current.id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  → {s.name}
                </option>
              ))}
          </select>
          <button
            type="submit"
            className="rounded-xl text-xs font-semibold bg-skip-mist text-skip-slate hover:text-skip-ink px-2 py-2"
            aria-label="Apply reassign"
          >
            ↵
          </button>
        </form>
      ) : null}
    </div>
  );
}

function FormButton({
  id,
  action,
  label,
  primary,
  subtle,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  primary?: boolean;
  subtle?: boolean;
}) {
  const base = "rounded-xl text-sm font-semibold px-4 py-2 transition";
  const cls = primary
    ? `${base} bg-skip-accent text-white hover:bg-skip-accentHi shadow-card`
    : subtle
    ? `${base} text-skip-stone hover:text-skip-ink hover:bg-skip-mist`
    : `${base} bg-skip-mist text-skip-slate hover:bg-skip-stone/20`;
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={cls}>
        {label}
      </button>
    </form>
  );
}

export function QueueList({
  entries,
  stylists = [],
}: {
  entries: QueueEntry[];
  stylists?: Stylist[];
}) {
  if (entries.length === 0) {
    return (
      <div className="skip-card p-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-skip-successLo flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#28C58A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-skip-ink">No wait right now</h2>
        <p className="mt-1 text-skip-slate">
          Customers will appear here the moment they tap &ldquo;Skip the queue.&rdquo;
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry, idx) => {
        const badge = statusBadge(entry.status);
        const stylist = pickOne(entry.stylists);
        return (
          <li key={entry.id} className="skip-card p-4 flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold shrink-0 ${positionChipClass(
                entry.status,
              )}`}
            >
              {idx + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-bold text-skip-ink truncate text-lg">
                  {displayName(entry)}
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${badge.cls}`}
                >
                  {badge.label}
                </span>
              </div>
              <div className="text-sm text-skip-slate mt-0.5 truncate">
                Joined {timeSince(entry.joined_at)}
                {stylist ? <> · with <span className="font-medium">{stylist.name}</span></> : null}
                {entry.notes ? <> · {entry.notes}</> : null}
              </div>
            </div>

            {entry.estimated_wait_min != null ? (
              <div className="text-right shrink-0 px-3 hidden sm:block">
                <div className="text-2xl font-extrabold text-skip-ink leading-none">
                  {entry.estimated_wait_min}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-skip-stone mt-1">
                  min ETA
                </div>
              </div>
            ) : null}

            <ActionButtons entry={entry} stylists={stylists} />
          </li>
        );
      })}
    </ol>
  );
}
