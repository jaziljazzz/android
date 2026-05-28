type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAY_ORDER: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
// JS Date.getDay() returns 0=Sun..6=Sat which matches DAY_ORDER above.

type DayHours = { open: string; close: string } | null;
export type HoursJson = Partial<Record<DayKey, DayHours>>;

function nowInKolkata(): Date {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value] as const),
  ) as Record<string, string>;
  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`,
  );
}

function parseTime(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/u.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export interface OpenState {
  open: boolean;
  closesAt?: string; // "20:00" if currently open
  opensAt?: string; // "10:00" if currently closed but opens later today
  closedToday: boolean;
}

export function computeOpenState(hours: HoursJson | null | undefined): OpenState {
  if (!hours || Object.keys(hours).length === 0) {
    return { open: true, closedToday: false };
  }
  const local = nowInKolkata();
  const key = DAY_ORDER[local.getDay()];
  const day = hours[key];
  if (day === undefined) return { open: true, closedToday: false };
  if (day === null) return { open: false, closedToday: true };

  const openMin = parseTime(day.open);
  const closeMin = parseTime(day.close);
  if (openMin === null || closeMin === null) {
    return { open: true, closedToday: false };
  }
  const nowMin = local.getHours() * 60 + local.getMinutes();
  let isOpen: boolean;
  if (closeMin < openMin) {
    isOpen = nowMin >= openMin || nowMin < closeMin;
  } else {
    isOpen = nowMin >= openMin && nowMin < closeMin;
  }
  return {
    open: isOpen,
    closesAt: isOpen ? day.close : undefined,
    opensAt: !isOpen && nowMin < openMin ? day.open : undefined,
    closedToday: false,
  };
}
