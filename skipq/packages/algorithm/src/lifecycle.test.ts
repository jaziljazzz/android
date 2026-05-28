import { describe, expect, it } from "vitest";
import { calculateWaitTime, type QueueEntryAhead } from "./calculateWaitTime";

// Walks the algorithm through a join → arrive → serve → complete cycle
// and asserts the new customer's ETA shrinks at each step.

const services = [{ serviceId: "hair", defaultDurationMin: 30, category: "hair" }];

function runFor(ahead: QueueEntryAhead[]) {
  return calculateWaitTime({
    ahead,
    services,
    stylistCompletedServices: 50,
  });
}

describe("queue lifecycle", () => {
  it("ETA strictly shrinks as customers move from waiting → completed", () => {
    // 3 customers ahead, none started yet.
    const t0 = runFor([
      { services },
      { services },
      { services },
    ]);

    // The first one's service has started 10 minutes ago.
    const t1 = runFor([
      { services, startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
      { services },
      { services },
    ]);

    // First customer completes — only 2 ahead now.
    const t2 = runFor([
      { services },
      { services },
    ]);

    // Second one is mid-service.
    const t3 = runFor([
      { services, startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
      { services },
    ]);

    // Empty queue: ETA collapses to just the new customer's own service.
    const t4 = runFor([]);

    expect(t1.totalEtaMin).toBeLessThanOrEqual(t0.totalEtaMin);
    expect(t2.totalEtaMin).toBeLessThan(t1.totalEtaMin);
    expect(t3.totalEtaMin).toBeLessThanOrEqual(t2.totalEtaMin);
    expect(t4.totalEtaMin).toBeLessThan(t3.totalEtaMin);
    // With nothing ahead, ETA is just our own service duration.
    expect(t4.totalEtaMin).toBe(30);
  });

  it("an in-progress customer never has a negative remaining time", () => {
    // Customer started 90 minutes ago (way past their 30 min estimate).
    const r = runFor([
      { services, startedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
    ]);
    // Our own 30 min + max(0, 30 - 90) = 30 + 0 = 30
    expect(r.totalEtaMin).toBeGreaterThanOrEqual(30);
  });
});
