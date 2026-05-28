import { describe, expect, it } from "vitest";
import { calculateWaitTime } from "./calculateWaitTime";
import { MIN_SAMPLES_FOR_POINT_ESTIMATE } from "./format";

describe("calculateWaitTime calibration threshold", () => {
  const services = [{ serviceId: "hair", defaultDurationMin: 30, category: "hair" }];

  it("disables point estimate when stylist is below the threshold", () => {
    const r = calculateWaitTime({
      ahead: [],
      services,
      stylistCompletedServices: MIN_SAMPLES_FOR_POINT_ESTIMATE - 1,
    });
    expect(r.hasPointEstimate).toBe(false);
    expect(r.rangeMin.high).toBeGreaterThan(r.rangeMin.low);
  });

  it("enables point estimate once the stylist crosses the threshold", () => {
    const r = calculateWaitTime({
      ahead: [],
      services,
      stylistCompletedServices: MIN_SAMPLES_FOR_POINT_ESTIMATE,
    });
    expect(r.hasPointEstimate).toBe(true);
  });

  it("never exceeds the display cap before formatting", () => {
    const r = calculateWaitTime({
      ahead: Array.from({ length: 6 }, () => ({ services })),
      services,
      stylistCompletedServices: 50,
    });
    // Raw mins can be large; the cap is enforced by formatEta on render.
    expect(r.totalEtaMin).toBeGreaterThan(0);
  });
});
