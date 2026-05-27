/**
 * A service combo's "signature" is the ordered set of service IDs that were
 * delivered together in a single sitting. Used as the key for per-stylist
 * learned durations in the `service_timings` table.
 *
 * Combos are faster than the naive sum because some services overlap (the
 * barber trims while waiting for colour to set, etc.). Spec §10 gives
 * starting multipliers; the algorithm should learn per-stylist multipliers
 * over time in v2.
 */

export function serviceSignature(serviceIds: readonly string[]): string {
  if (serviceIds.length === 0) {
    throw new Error("serviceSignature: at least one service required");
  }
  // Sort so [a, b] and [b, a] hash the same.
  return [...serviceIds].sort().join("+");
}

export const COMBO_MULTIPLIERS = {
  /** Haircut + beard happens in parallel-ish */
  haircutBeard: 0.85,
  /** Wash + cut overlap a little */
  washCut: 0.92,
  /** Colour + cut overlap during processing time */
  colourCut: 0.95,
  /** Default for an unseen combo, per §18 "service combo never seen before" */
  defaultUnseen: 0.9,
} as const;

/**
 * Given a list of service categories, return the multiplier to apply to the
 * naive sum of their durations. Categories should match the `services.category`
 * column ('hair' | 'beard' | 'colour' | 'facial').
 *
 * This is the cold-start heuristic. Once we have learned per-stylist combo
 * durations from `service_timings`, the algorithm should use those instead.
 */
export function comboMultiplier(categories: readonly string[]): number {
  if (categories.length <= 1) return 1;

  const set = new Set(categories);
  if (set.has("hair") && set.has("beard") && set.size === 2) {
    return COMBO_MULTIPLIERS.haircutBeard;
  }
  if (set.has("hair") && set.has("colour") && set.size === 2) {
    return COMBO_MULTIPLIERS.colourCut;
  }
  // "wash" isn't a top-level category in the schema yet — listed in spec
  // for v2. Fall through to defaultUnseen for any other combo.
  return COMBO_MULTIPLIERS.defaultUnseen;
}
