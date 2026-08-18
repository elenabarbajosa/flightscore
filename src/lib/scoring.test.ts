import { describe, expect, it } from "vitest";

import {
  airportChangeItinerary,
  comparisonItineraries,
  domesticRiskyItinerary,
  domesticSafeItinerary,
  equalValueItineraries,
  exactLongLayoverItinerary,
  exactTieItineraries,
  internationalRiskyItinerary,
  internationalSafeItinerary,
  longLayoverItinerary,
  multiPenaltyItinerary,
  rankingItineraries,
  roundTripPenaltyItinerary,
  schengenRiskyItinerary,
} from "@/lib/fixtures/scoring-itineraries";
import type { ScoredItinerary } from "@/lib/types/scoring";
import {
  compareScoredResults,
  DEFAULT_WEIGHTS,
  isLayoverRisky,
  isLongLayover,
  resolveWeights,
  SCORING_PRESETS,
  scoreItineraries,
} from "@/lib/scoring";

const defaultOptions = {
  weights: DEFAULT_WEIGHTS,
  showTightConnections: true,
};

function scoreSingle(
  itineraries: Parameters<typeof scoreItineraries>[0],
  options = defaultOptions,
) {
  return scoreItineraries(itineraries, options);
}

describe("scoreItineraries", () => {
  it("returns an empty array for empty input", () => {
    expect(scoreItineraries([], defaultOptions)).toEqual([]);
  });

  it("gives the cheapest itinerary the highest priceNorm", () => {
    const scored = scoreSingle(comparisonItineraries);
    const cheap = scored.find((entry) => entry.itinerary.id === "cheap");
    const mid = scored.find((entry) => entry.itinerary.id === "mid");

    expect(cheap?.score.priceNorm).toBe(1);
    expect(mid?.score.priceNorm).toBeLessThan(1);
  });

  it("gives the fastest itinerary the highest durationNorm", () => {
    const scored = scoreSingle(comparisonItineraries);
    const fastest = scored.find(
      (entry) => entry.itinerary.id === "fast-few-stops",
    );

    expect(fastest?.score.durationNorm).toBe(1);
  });

  it("gives the fewest-stop itinerary the highest stopsNorm", () => {
    const scored = scoreSingle(comparisonItineraries);
    const fewestStops = scored.find(
      (entry) => entry.itinerary.id === "fast-few-stops",
    );

    expect(fewestStops?.score.stopsNorm).toBe(1);
  });

  it("uses normalized value 1 when all values are equal", () => {
    const scored = scoreSingle(equalValueItineraries);

    for (const entry of scored) {
      expect(entry.score.priceNorm).toBe(1);
      expect(entry.score.durationNorm).toBe(1);
      expect(entry.score.stopsNorm).toBe(1);
    }
  });

  it("uses default weights 5/3/5", () => {
    const scored = scoreSingle(equalValueItineraries);

    expect(scored[0]?.score.rawWeights).toEqual(DEFAULT_WEIGHTS);
    expect(scored[0]?.score.appliedWeights.price).toBeCloseTo(5 / 13);
    expect(scored[0]?.score.appliedWeights.stops).toBeCloseTo(3 / 13);
    expect(scored[0]?.score.appliedWeights.duration).toBeCloseTo(5 / 13);
  });

  it("supports the Cheapest preset 9/2/2", () => {
    const scored = scoreItineraries(equalValueItineraries, {
      ...defaultOptions,
      weights: SCORING_PRESETS.CHEAPEST,
    });

    expect(scored[0]?.score.rawWeights).toEqual(SCORING_PRESETS.CHEAPEST);
  });

  it("supports the Balanced preset 5/3/5", () => {
    const scored = scoreItineraries(equalValueItineraries, {
      ...defaultOptions,
      weights: SCORING_PRESETS.BALANCED,
    });

    expect(scored[0]?.score.rawWeights).toEqual(SCORING_PRESETS.BALANCED);
  });

  it("supports the Fastest preset 2/5/9", () => {
    const scored = scoreItineraries(equalValueItineraries, {
      ...defaultOptions,
      weights: SCORING_PRESETS.FASTEST,
    });

    expect(scored[0]?.score.rawWeights).toEqual(SCORING_PRESETS.FASTEST);
  });

  it("marks domestic layovers under 60 minutes as risky", () => {
    const scored = scoreSingle([domesticRiskyItinerary, domesticSafeItinerary]);

    expect(
      scored.find((entry) => entry.itinerary.id === "domestic-risky")?.score
        .isRisky,
    ).toBe(true);
    expect(
      scored.find((entry) => entry.itinerary.id === "domestic-safe")?.score
        .isRisky,
    ).toBe(false);
  });

  it("marks Schengen layovers under 60 minutes as risky", () => {
    const scored = scoreSingle([schengenRiskyItinerary]);

    expect(scored[0]?.score.isRisky).toBe(true);
    expect(isLayoverRisky(schengenRiskyItinerary.outbound.layovers[0]!)).toBe(
      true,
    );
  });

  it("marks international layovers under 90 minutes as risky", () => {
    const scored = scoreSingle([
      internationalRiskyItinerary,
      internationalSafeItinerary,
    ]);

    expect(
      scored.find((entry) => entry.itinerary.id === "international-risky")?.score
        .isRisky,
    ).toBe(true);
    expect(
      scored.find((entry) => entry.itinerary.id === "international-safe")?.score
        .isRisky,
    ).toBe(false);
  });

  it("does not mark exact domestic/Schengen 60-minute thresholds as risky", () => {
    expect(isLayoverRisky(domesticSafeItinerary.outbound.layovers[0]!)).toBe(
      false,
    );
  });

  it("does not mark exact international 90-minute thresholds as risky", () => {
    expect(
      isLayoverRisky(internationalSafeItinerary.outbound.layovers[0]!),
    ).toBe(false);
  });

  it("applies both risky and airport-change penalties for airport changes", () => {
    const scored = scoreSingle([airportChangeItinerary, domesticSafeItinerary]);
    const entry = scored.find(
      (item) => item.itinerary.id === "airport-change",
    );

    expect(entry?.score.riskyConnectionCount).toBe(1);
    expect(entry?.score.airportChangeCount).toBe(1);
    expect(entry?.score.totalPenaltyFactor).toBeCloseTo(0.75 * 0.7);
  });

  it("applies the long layover penalty above 300 minutes", () => {
    const scored = scoreSingle([longLayoverItinerary, domesticSafeItinerary]);
    const entry = scored.find((item) => item.itinerary.id === "long-layover");

    expect(entry?.score.longLayoverCount).toBe(1);
    expect(entry?.score.totalPenaltyFactor).toBeCloseTo(0.9);
  });

  it("does not apply the long layover penalty at exactly 300 minutes", () => {
    const scored = scoreSingle([
      exactLongLayoverItinerary,
      domesticSafeItinerary,
    ]);
    const entry = scored.find(
      (item) => item.itinerary.id === "exact-long-layover",
    );

    expect(isLongLayover(exactLongLayoverItinerary.outbound.layovers[0]!)).toBe(
      false,
    );
    expect(entry?.score.longLayoverCount).toBe(0);
  });

  it("multiplies multiple penalties independently", () => {
    const scored = scoreSingle([multiPenaltyItinerary, domesticSafeItinerary]);
    const entry = scored.find((item) => item.itinerary.id === "multi-penalty");

    expect(entry?.score.totalPenaltyFactor).toBeCloseTo(0.75 * 0.7);
  });

  it("counts penalties across outbound and inbound journeys", () => {
    const scored = scoreSingle([
      roundTripPenaltyItinerary,
      domesticSafeItinerary,
    ]);
    const entry = scored.find(
      (item) => item.itinerary.id === "round-trip-penalties",
    );

    expect(entry?.score.riskyConnectionCount).toBe(1);
    expect(entry?.score.longLayoverCount).toBe(1);
    expect(entry?.score.totalPenaltyFactor).toBeCloseTo(0.75 * 0.9);
  });

  it("breaks exact score ties by lower price", () => {
    const higherPrice = {
      itinerary: { id: "high", price: 700 } as ScoredItinerary["itinerary"],
      score: { finalScore: 50 } as ScoredItinerary["score"],
    };
    const lowerPrice = {
      itinerary: { id: "low", price: 500 } as ScoredItinerary["itinerary"],
      score: { finalScore: 50 } as ScoredItinerary["score"],
    };

    expect(compareScoredResults(higherPrice, 0, lowerPrice, 1)).toBeGreaterThan(
      0,
    );
  });

  it("preserves original input order when finalScore and price tie", () => {
    const scored = scoreSingle(exactTieItineraries);

    expect(scored.map((entry) => entry.itinerary.id)).toEqual([
      "exact-tie-first",
      "exact-tie-second",
    ]);
  });

  it("uses normal score order when showTightConnections is true", () => {
    const scored = scoreItineraries(rankingItineraries, {
      weights: DEFAULT_WEIGHTS,
      showTightConnections: true,
    });

    for (let index = 0; index < scored.length - 1; index += 1) {
      expect(scored[index]?.score.finalScore).toBeGreaterThanOrEqual(
        scored[index + 1]?.score.finalScore ?? 0,
      );
    }

    expect(scored.some((entry) => entry.score.isRisky)).toBe(true);
    expect(scored.some((entry) => !entry.score.isRisky)).toBe(true);
  });

  it("prioritizes non-risky itineraries in positions 1-5 when showTightConnections is false", () => {
    const scored = scoreItineraries(rankingItineraries, {
      weights: DEFAULT_WEIGHTS,
      showTightConnections: false,
    });
    const topFive = scored.slice(0, 5);

    expect(topFive.filter((entry) => !entry.score.isRisky)).toHaveLength(3);
    expect(topFive.filter((entry) => entry.score.isRisky)).toHaveLength(2);
    expect(topFive.every((entry) => !entry.score.isRisky || entry.score.isRisky))
      .toBe(true);
    expect(topFive.slice(0, 3).every((entry) => !entry.score.isRisky)).toBe(
      true,
    );
  });

  it("fills remaining top-5 slots with risky itineraries when fewer than five non-risky exist", () => {
    const scored = scoreItineraries(rankingItineraries, {
      weights: DEFAULT_WEIGHTS,
      showTightConnections: false,
    });

    expect(scored.slice(0, 5).map((entry) => entry.itinerary.id)).toEqual([
      "rank-safe-high",
      "rank-safe-mid",
      "rank-safe-low",
      "rank-risky-high",
      "rank-risky-mid",
    ]);
  });

  it("never drops or duplicates itineraries in ranking output", () => {
    const input = rankingItineraries;
    const scored = scoreItineraries(input, {
      weights: DEFAULT_WEIGHTS,
      showTightConnections: false,
    });
    const ids = scored.map((entry) => entry.itinerary.id);

    expect(scored).toHaveLength(input.length);
    expect(new Set(ids).size).toBe(input.length);
  });

  it("does not mutate input itineraries", () => {
    const input = structuredClone(rankingItineraries);
    const before = JSON.stringify(input);

    scoreItineraries(input, {
      weights: DEFAULT_WEIGHTS,
      showTightConnections: false,
    });

    expect(JSON.stringify(input)).toBe(before);
  });

  it("keeps finalScore on the 0-100 scale", () => {
    const scored = scoreSingle([
      ...comparisonItineraries,
      multiPenaltyItinerary,
    ]);

    for (const entry of scored) {
      expect(entry.score.finalScore).toBeGreaterThanOrEqual(0);
      expect(entry.score.finalScore).toBeLessThanOrEqual(100);
      expect(Number.isFinite(entry.score.finalScore)).toBe(true);
    }
  });

  it("sets baseScore to the sum of weighted contributions", () => {
    const scored = scoreSingle(comparisonItineraries);
    const entry = scored[0];

    expect(entry?.score.baseScore).toBeCloseTo(
      (entry?.score.priceContribution ?? 0) +
        (entry?.score.stopsContribution ?? 0) +
        (entry?.score.durationContribution ?? 0),
    );
  });

  it("falls back to default weights when the total raw weight is zero", () => {
    const resolved = resolveWeights({ price: 0, stops: 0, duration: 0 });

    expect(resolved.rawWeights).toEqual(DEFAULT_WEIGHTS);
  });

  it("falls back to default weights for invalid raw weights", () => {
    const resolved = resolveWeights({
      price: Number.NaN,
      stops: 2,
      duration: 2,
    });

    expect(resolved.rawWeights).toEqual(DEFAULT_WEIGHTS);
  });

  it("never emits NaN or Infinity from scoring output", () => {
    const scored = scoreSingle([
      ...comparisonItineraries,
      multiPenaltyItinerary,
      roundTripPenaltyItinerary,
    ]);

    for (const entry of scored) {
      for (const value of Object.values(entry.score)) {
        if (typeof value === "number") {
          expect(Number.isFinite(value)).toBe(true);
        }
      }
    }
  });
});

describe("worked numerical scoring example", () => {
  it("computes a deterministic penalty-adjusted score", () => {
    const scored = scoreSingle([domesticSafeItinerary, airportChangeItinerary]);
    const safe = scored.find((entry) => entry.itinerary.id === "domestic-safe");
    const risky = scored.find(
      (entry) => entry.itinerary.id === "airport-change",
    );

    expect(safe?.score.baseScore).toBe(1);
    expect(safe?.score.finalScore).toBe(100);
    expect(risky?.score.baseScore).toBe(1);
    expect(risky?.score.totalPenaltyFactor).toBeCloseTo(0.525);
    expect(risky?.score.finalScore).toBeCloseTo(52.5);
  });
});
