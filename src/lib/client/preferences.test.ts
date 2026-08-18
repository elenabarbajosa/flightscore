import { describe, expect, it } from "vitest";

import {
  detectActivePreset,
  sanitizeWeightChange,
  validatePreferenceWeights,
} from "@/lib/client/preferences";
import { SCORING_PRESETS } from "@/lib/scoring";

describe("preference weights", () => {
  it("blocks all-zero effective UI preference state", () => {
    expect(
      validatePreferenceWeights({ price: 0, stops: 0, duration: 0 }),
    ).toBe("At least one preference must be greater than zero.");
    expect(
      sanitizeWeightChange({ price: 1, stops: 1, duration: 1 }, "price", 0),
    ).toEqual({ price: 0, stops: 1, duration: 1 });
    expect(
      sanitizeWeightChange({ price: 1, stops: 0, duration: 0 }, "price", 0),
    ).toBeNull();
  });

  it("detects preset matches and custom weights", () => {
    expect(detectActivePreset(SCORING_PRESETS.CHEAPEST, SCORING_PRESETS)).toBe(
      "CHEAPEST",
    );
    expect(detectActivePreset(SCORING_PRESETS.BALANCED, SCORING_PRESETS)).toBe(
      "BALANCED",
    );
    expect(
      detectActivePreset({ price: 4, stops: 3, duration: 5 }, SCORING_PRESETS),
    ).toBe("CUSTOM");
  });
});
