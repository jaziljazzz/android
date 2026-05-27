/**
 * skipQ wait-time algorithm v1 (spec §10).
 *
 * Intent
 * ------
 * Given the current state of a salon's queue and the new customer's
 * requested services, return the expected wait time in minutes plus a
 * confidence-aware range.
 *
 * v1 uses simple averages (service catalog defaults). v2 will replace
 * `estimateServiceDuration` with per-stylist learned durations from the
 * `service_timings` table. The shape of this function does not change
 * between v1 and v2 — only the duration source.
 *
 * Critical constraints (spec §10 "CRITICAL"):
 *   - Stylists with <10 completed services → no point estimate, return range
 *   - Cap outliers at 3× median when learning (handled in the timings writer,
 *     not here)
 *   - Combo multiplier for services delivered together
 *   - Caller is responsible for rounding to 5-min increments for display —
 *     this function returns the raw minute count; use `formatEta` to render.
 */

import { comboMultiplier, serviceSignature } from "./signature";
import { MIN_SAMPLES_FOR_POINT_ESTIMATE } from "./format";

export interface ServiceRequest {
  /** ID from public.services */
  serviceId: string;
  /** Default catalog duration in minutes (used when no learned data) */
  defaultDurationMin: number;
  /** Service category for combo-multiplier lookup */
  category: string;
}

/**
 * A queue entry already ahead of the new customer at the same stylist.
 * Provide either `startedAt` (service is in progress) or omit it (still
 * waiting). The algorithm subtracts elapsed time from the estimate when
 * a service has started.
 */
export interface QueueEntryAhead {
  services: ServiceRequest[];
  /** ISO datetime when service started; undefined if not yet started. */
  startedAt?: string;
}

export interface CalculateWaitTimeInput {
  /**
   * Customers ahead of the new entry at the assigned stylist. If the customer
   * selected "any stylist", caller should pass the queue for the stylist with
   * the shortest projected wait.
   */
  ahead: QueueEntryAhead[];

  /** Services the new customer is requesting */
  services: ServiceRequest[];

  /**
   * Number of completed services this stylist has logged. When < 10 the
   * algorithm refuses to return a point estimate and returns only a range.
   */
  stylistCompletedServices: number;

  /**
   * Wall-clock for "now". Defaults to Date.now(). Inject in tests for
   * deterministic snapshots.
   */
  now?: Date;

  /**
   * Optional confidence band as a fraction of the point estimate.
   * Defaults to ±20%. Used for "could be 18–28 min" UI copy.
   */
  confidenceBandFraction?: number;
}

export interface CalculateWaitTimeResult {
  /**
   * The customer's own service time. Always reported so the UI can show
   * "your service: 30 min".
   */
  serviceDurationMin: number;

  /**
   * Sum of remaining time of customers ahead, before the new customer's own
   * service starts. Zero if the queue is empty.
   */
  waitBeforeServiceMin: number;

  /**
   * Total time from join to walking out (= waitBeforeServiceMin +
   * serviceDurationMin). This is what most UIs display as "ETA".
   */
  totalEtaMin: number;

  /**
   * Range to display when we don't trust the point estimate (new stylist,
   * sparse data). When `hasPointEstimate` is true, this is just a confidence
   * band around `totalEtaMin`.
   */
  rangeMin: { low: number; high: number };

  /**
   * False when the stylist has fewer than MIN_SAMPLES_FOR_POINT_ESTIMATE
   * completed services. UI should show the range, not the point estimate.
   */
  hasPointEstimate: boolean;

  /** Signature of the requested service combo (for service_timings lookup). */
  signature: string;
}

const MS_PER_MIN = 60_000;
const DEFAULT_CONFIDENCE_BAND = 0.2;

function elapsedMin(startedAt: string, now: Date): number {
  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs)) return 0;
  return Math.max(0, (now.getTime() - startedMs) / MS_PER_MIN);
}

function estimateServiceDuration(services: ServiceRequest[]): number {
  if (services.length === 0) return 0;
  const naiveSum = services.reduce((acc, s) => acc + s.defaultDurationMin, 0);
  const multiplier = comboMultiplier(services.map((s) => s.category));
  return naiveSum * multiplier;
}

/**
 * Remaining time for a queue entry already in progress or waiting at the
 * stylist. Per spec §10 v1:
 *   - If started: remaining = avg_duration - elapsed (floored at 0)
 *   - Otherwise:  remaining = avg_duration
 */
function remainingTimeFor(entry: QueueEntryAhead, now: Date): number {
  const fullDuration = estimateServiceDuration(entry.services);
  if (!entry.startedAt) return fullDuration;
  const elapsed = elapsedMin(entry.startedAt, now);
  return Math.max(0, fullDuration - elapsed);
}

export function calculateWaitTime(input: CalculateWaitTimeInput): CalculateWaitTimeResult {
  const {
    ahead,
    services,
    stylistCompletedServices,
    now = new Date(),
    confidenceBandFraction = DEFAULT_CONFIDENCE_BAND,
  } = input;

  if (services.length === 0) {
    throw new Error("calculateWaitTime: at least one service required");
  }

  const serviceDurationMin = estimateServiceDuration(services);
  const waitBeforeServiceMin = ahead.reduce(
    (acc, entry) => acc + remainingTimeFor(entry, now),
    0,
  );
  const totalEtaMin = waitBeforeServiceMin + serviceDurationMin;

  const hasPointEstimate = stylistCompletedServices >= MIN_SAMPLES_FOR_POINT_ESTIMATE;
  const band = Math.max(0, Math.min(1, confidenceBandFraction));
  const rangeMin = {
    low: Math.max(0, totalEtaMin * (1 - band)),
    high: totalEtaMin * (1 + band),
  };

  return {
    serviceDurationMin,
    waitBeforeServiceMin,
    totalEtaMin,
    rangeMin,
    hasPointEstimate,
    signature: serviceSignature(services.map((s) => s.serviceId)),
  };
}
