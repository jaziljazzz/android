import { describe, expect, it } from "vitest";
import {
  COMBO_MULTIPLIERS,
  comboMultiplier,
  serviceSignature,
} from "./signature";

describe("serviceSignature", () => {
  it("joins single service", () => {
    expect(serviceSignature(["svc-1"])).toBe("svc-1");
  });

  it("is order-independent", () => {
    expect(serviceSignature(["a", "b"])).toBe(serviceSignature(["b", "a"]));
    expect(serviceSignature(["a", "b", "c"])).toBe(
      serviceSignature(["c", "a", "b"]),
    );
  });

  it("throws on empty input", () => {
    expect(() => serviceSignature([])).toThrow();
  });
});

describe("comboMultiplier", () => {
  it("returns 1 for single service", () => {
    expect(comboMultiplier(["hair"])).toBe(1);
  });

  it("applies haircut+beard parallel discount", () => {
    expect(comboMultiplier(["hair", "beard"])).toBe(
      COMBO_MULTIPLIERS.haircutBeard,
    );
    expect(comboMultiplier(["beard", "hair"])).toBe(
      COMBO_MULTIPLIERS.haircutBeard,
    );
  });

  it("applies colour+cut discount", () => {
    expect(comboMultiplier(["hair", "colour"])).toBe(
      COMBO_MULTIPLIERS.colourCut,
    );
  });

  it("falls back to default for unknown combos", () => {
    expect(comboMultiplier(["hair", "beard", "facial"])).toBe(
      COMBO_MULTIPLIERS.defaultUnseen,
    );
    expect(comboMultiplier(["facial", "colour"])).toBe(
      COMBO_MULTIPLIERS.defaultUnseen,
    );
  });
});
