import { describe, expect, it } from "vitest";
import {
  calculateWaitTime,
  type QueueEntryAhead,
  type ServiceRequest,
} from "./calculateWaitTime";
import { COMBO_MULTIPLIERS } from "./signature";

const HAIRCUT: ServiceRequest = {
  serviceId: "svc-haircut",
  defaultDurationMin: 30,
  category: "hair",
};

const BEARD: ServiceRequest = {
  serviceId: "svc-beard",
  defaultDurationMin: 15,
  category: "beard",
};

const COLOUR: ServiceRequest = {
  serviceId: "svc-colour",
  defaultDurationMin: 90,
  category: "colour",
};

const SEASONED_STYLIST = 50; // > MIN_SAMPLES_FOR_POINT_ESTIMATE
const NEW_STYLIST = 3; // < MIN_SAMPLES_FOR_POINT_ESTIMATE

describe("calculateWaitTime — empty queue", () => {
  it("returns own service duration when nobody is ahead", () => {
    const r = calculateWaitTime({
      ahead: [],
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
    });

    expect(r.waitBeforeServiceMin).toBe(0);
    expect(r.serviceDurationMin).toBe(30);
    expect(r.totalEtaMin).toBe(30);
    expect(r.hasPointEstimate).toBe(true);
    expect(r.signature).toBe("svc-haircut");
  });
});

describe("calculateWaitTime — queue ahead, not yet started", () => {
  it("sums full default durations of waiting customers", () => {
    const ahead: QueueEntryAhead[] = [
      { services: [HAIRCUT] }, // 30
      { services: [HAIRCUT] }, // 30
      { services: [BEARD] }, // 15
    ];

    const r = calculateWaitTime({
      ahead,
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
    });

    // 30 + 30 + 15 = 75 ahead, then own 30 = 105
    expect(r.waitBeforeServiceMin).toBe(75);
    expect(r.totalEtaMin).toBe(105);
  });
});

describe("calculateWaitTime — queue ahead, in progress", () => {
  it("subtracts elapsed time from the active service", () => {
    const now = new Date("2026-05-27T10:30:00Z");
    // 30-min haircut started 12 min ago → 18 min remaining
    const ahead: QueueEntryAhead[] = [
      {
        services: [HAIRCUT],
        startedAt: "2026-05-27T10:18:00Z",
      },
      { services: [HAIRCUT] }, // waiting → 30
    ];

    const r = calculateWaitTime({
      ahead,
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
      now,
    });

    // 18 + 30 ahead + 30 own = 78
    expect(r.waitBeforeServiceMin).toBe(48);
    expect(r.totalEtaMin).toBe(78);
  });

  it("floors remaining time at 0 if service ran over default", () => {
    const now = new Date("2026-05-27T10:30:00Z");
    // 30-min haircut started 45 min ago → would be -15, floored to 0
    const ahead: QueueEntryAhead[] = [
      {
        services: [HAIRCUT],
        startedAt: "2026-05-27T09:45:00Z",
      },
    ];

    const r = calculateWaitTime({
      ahead,
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
      now,
    });

    expect(r.waitBeforeServiceMin).toBe(0);
    expect(r.totalEtaMin).toBe(30);
  });

  it("ignores malformed startedAt timestamps", () => {
    const ahead: QueueEntryAhead[] = [
      { services: [HAIRCUT], startedAt: "not-a-date" },
    ];

    const r = calculateWaitTime({
      ahead,
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
      now: new Date("2026-05-27T10:30:00Z"),
    });

    // Malformed timestamp → elapsed = 0 → full duration remaining
    expect(r.waitBeforeServiceMin).toBe(30);
  });
});

describe("calculateWaitTime — combo multipliers", () => {
  it("applies haircut+beard parallel discount to own service", () => {
    const r = calculateWaitTime({
      ahead: [],
      services: [HAIRCUT, BEARD],
      stylistCompletedServices: SEASONED_STYLIST,
    });

    const naive = 30 + 15;
    expect(r.serviceDurationMin).toBe(naive * COMBO_MULTIPLIERS.haircutBeard);
    expect(r.totalEtaMin).toBe(naive * COMBO_MULTIPLIERS.haircutBeard);
  });

  it("applies discount per ahead-of-you customer's combo too", () => {
    const ahead: QueueEntryAhead[] = [
      { services: [HAIRCUT, BEARD] }, // 45 * 0.85 = 38.25
    ];

    const r = calculateWaitTime({
      ahead,
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
    });

    expect(r.waitBeforeServiceMin).toBeCloseTo(45 * COMBO_MULTIPLIERS.haircutBeard);
  });

  it("normalizes signature regardless of input order", () => {
    const a = calculateWaitTime({
      ahead: [],
      services: [HAIRCUT, BEARD],
      stylistCompletedServices: SEASONED_STYLIST,
    });
    const b = calculateWaitTime({
      ahead: [],
      services: [BEARD, HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
    });
    expect(a.signature).toBe(b.signature);
    expect(a.signature).toBe("svc-beard+svc-haircut");
  });
});

describe("calculateWaitTime — confidence", () => {
  it("marks hasPointEstimate false when stylist is new", () => {
    const r = calculateWaitTime({
      ahead: [],
      services: [HAIRCUT],
      stylistCompletedServices: NEW_STYLIST,
    });
    expect(r.hasPointEstimate).toBe(false);
  });

  it("marks hasPointEstimate true at the threshold", () => {
    const r = calculateWaitTime({
      ahead: [],
      services: [HAIRCUT],
      stylistCompletedServices: 10,
    });
    expect(r.hasPointEstimate).toBe(true);
  });

  it("derives ±20% range from totalEtaMin by default", () => {
    const r = calculateWaitTime({
      ahead: [{ services: [HAIRCUT] }],
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
    });
    // total = 60; range = ±20% = 48 ↔ 72
    expect(r.rangeMin.low).toBe(48);
    expect(r.rangeMin.high).toBe(72);
  });

  it("uses custom confidence band when provided", () => {
    const r = calculateWaitTime({
      ahead: [],
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
      confidenceBandFraction: 0.5,
    });
    expect(r.rangeMin.low).toBe(15);
    expect(r.rangeMin.high).toBe(45);
  });

  it("clamps absurd bands into [0, 1]", () => {
    const r = calculateWaitTime({
      ahead: [],
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
      confidenceBandFraction: 5,
    });
    // clamped to 1 → low = 0, high = 60
    expect(r.rangeMin.low).toBe(0);
    expect(r.rangeMin.high).toBe(60);
  });

  it("never returns a negative low end", () => {
    const r = calculateWaitTime({
      ahead: [],
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
      confidenceBandFraction: 2,
    });
    expect(r.rangeMin.low).toBeGreaterThanOrEqual(0);
  });
});

describe("calculateWaitTime — input validation", () => {
  it("throws when no services are requested", () => {
    expect(() =>
      calculateWaitTime({
        ahead: [],
        services: [],
        stylistCompletedServices: SEASONED_STYLIST,
      }),
    ).toThrow();
  });
});

describe("calculateWaitTime — realistic scenario from spec §4 brand examples", () => {
  it("'You're #4. About 22 min.' style", () => {
    // 3 people ahead, all simple haircuts. Front of queue started 8 min ago.
    const now = new Date("2026-05-27T16:08:00Z");
    const ahead: QueueEntryAhead[] = [
      { services: [HAIRCUT], startedAt: "2026-05-27T16:00:00Z" }, // 22 left
      { services: [HAIRCUT] }, // 30
      { services: [HAIRCUT] }, // 30
    ];

    const r = calculateWaitTime({
      ahead,
      services: [HAIRCUT],
      stylistCompletedServices: SEASONED_STYLIST,
      now,
    });

    // 22 + 30 + 30 = 82 wait, then own 30 = 112 total
    expect(r.waitBeforeServiceMin).toBe(82);
    expect(r.totalEtaMin).toBe(112);
  });
});

describe("calculateWaitTime — long-service edge cases (spec §10)", () => {
  it("handles colour-only request (90 min default)", () => {
    const r = calculateWaitTime({
      ahead: [],
      services: [COLOUR],
      stylistCompletedServices: SEASONED_STYLIST,
    });
    expect(r.totalEtaMin).toBe(90);
  });
});
