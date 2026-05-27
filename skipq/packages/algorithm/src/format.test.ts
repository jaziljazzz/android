import { describe, expect, it } from "vitest";
import {
  ETA_DISPLAY_CAP_MIN,
  formatEta,
  roundToFive,
} from "./format";

describe("roundToFive", () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 5],
    [4, 5],
    [7, 5],
    [8, 10],
    [22, 20],
    [23, 25],
    [27, 25],
    [88, 90],
    [89, 90],
  ])("rounds %i → %i", (input, expected) => {
    expect(roundToFive(input)).toBe(expected);
  });

  it("clamps negative or NaN to 0", () => {
    expect(roundToFive(-5)).toBe(0);
    expect(roundToFive(Number.NaN)).toBe(0);
    expect(roundToFive(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("formatEta", () => {
  it("returns rounded point estimate when under cap", () => {
    expect(formatEta(22)).toBe("20 min");
    expect(formatEta(23)).toBe("25 min");
    expect(formatEta(8)).toBe("10 min");
  });

  it("caps at 90+ min display", () => {
    expect(formatEta(90)).toBe(`${ETA_DISPLAY_CAP_MIN}+ min`);
    expect(formatEta(95)).toBe(`${ETA_DISPLAY_CAP_MIN}+ min`);
    expect(formatEta(150)).toBe(`${ETA_DISPLAY_CAP_MIN}+ min`);
  });

  it("renders range copy when range provided", () => {
    expect(formatEta(22, { range: { lowMin: 18, highMin: 28 } })).toBe(
      "Usually 20 min · could be 20–30",
    );
  });

  it("caps range high end at display cap", () => {
    expect(formatEta(60, { range: { lowMin: 50, highMin: 120 } })).toBe(
      `Usually 60 min · could be 50–${ETA_DISPLAY_CAP_MIN}`,
    );
  });
});
