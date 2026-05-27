/**
 * UI-side display rules from spec §10:
 *   - Always round to 5-minute increments (never 23, 27 — always 20, 25, 30)
 *   - Cap displayed ETA at 90 min ("90+ min wait") to avoid scaring users
 *   - When a stylist has <10 completed services, show a range instead of a
 *     point estimate. We expose `MIN_SAMPLES_FOR_POINT_ESTIMATE` so the
 *     algorithm core and UI agree on the threshold.
 */

export const ETA_DISPLAY_CAP_MIN = 90;
export const MIN_SAMPLES_FOR_POINT_ESTIMATE = 10;
export const ROUND_INCREMENT_MIN = 5;

export function roundToFive(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes < 0) return 0;
  return Math.round(minutes / ROUND_INCREMENT_MIN) * ROUND_INCREMENT_MIN;
}

export interface FormatEtaOptions {
  range?: { lowMin: number; highMin: number };
}

/**
 * Renders an ETA the way the spec says it should appear in the UI.
 *   formatEta(22)                              -> "20 min"
 *   formatEta(23)                              -> "25 min"
 *   formatEta(95)                              -> "90+ min"
 *   formatEta(22, { range: { lowMin: 18, highMin: 28 } })
 *                                              -> "Usually 20 min · could be 20–30"
 */
export function formatEta(minutes: number, opts: FormatEtaOptions = {}): string {
  const rounded = roundToFive(minutes);
  if (rounded >= ETA_DISPLAY_CAP_MIN) {
    return `${ETA_DISPLAY_CAP_MIN}+ min`;
  }
  if (opts.range) {
    const lo = roundToFive(opts.range.lowMin);
    const hi = Math.min(roundToFive(opts.range.highMin), ETA_DISPLAY_CAP_MIN);
    return `Usually ${rounded} min · could be ${lo}–${hi}`;
  }
  return `${rounded} min`;
}
