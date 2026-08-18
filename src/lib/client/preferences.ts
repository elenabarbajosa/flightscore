import type { ScoringWeights } from "@/lib/types/scoring";

export type ActivePreset = "CHEAPEST" | "BALANCED" | "FASTEST" | "CUSTOM";

export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 10;

export function clampWeight(value: number): number {
  return Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(value)));
}

export function isAllWeightsZero(weights: ScoringWeights): boolean {
  return weights.price === 0 && weights.stops === 0 && weights.duration === 0;
}

export function validatePreferenceWeights(weights: ScoringWeights): string | null {
  if (isAllWeightsZero(weights)) {
    return "At least one preference must be greater than zero.";
  }

  return null;
}

export function sanitizeWeightChange(
  current: ScoringWeights,
  dimension: keyof ScoringWeights,
  nextValue: number,
): ScoringWeights | null {
  const candidate = {
    ...current,
    [dimension]: clampWeight(nextValue),
  };

  if (isAllWeightsZero(candidate)) {
    return null;
  }

  return candidate;
}

export function weightsMatchPreset(
  weights: ScoringWeights,
  preset: Exclude<ActivePreset, "CUSTOM">,
  presets: Record<Exclude<ActivePreset, "CUSTOM">, ScoringWeights>,
): boolean {
  const target = presets[preset];

  return (
    weights.price === target.price &&
    weights.stops === target.stops &&
    weights.duration === target.duration
  );
}

export function detectActivePreset(
  weights: ScoringWeights,
  presets: Record<Exclude<ActivePreset, "CUSTOM">, ScoringWeights>,
): ActivePreset {
  const presetIds: Array<Exclude<ActivePreset, "CUSTOM">> = [
    "CHEAPEST",
    "BALANCED",
    "FASTEST",
  ];

  for (const preset of presetIds) {
    if (weightsMatchPreset(weights, preset, presets)) {
      return preset;
    }
  }

  return "CUSTOM";
}
