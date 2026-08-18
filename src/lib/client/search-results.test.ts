import { describe, expect, it } from "vitest";

import {
  applyFailedSearch,
  applySuccessfulSearch,
  createEmptySearchResultsState,
  getNextVisibleCount,
  getVisibleScoredResults,
  INITIAL_VISIBLE_COUNT,
  scoreStoredItineraries,
  shouldShowMoreControl,
} from "@/lib/client/search-results";
import { comparisonItineraries, rankingItineraries } from "@/lib/fixtures/scoring-itineraries";
import { mockOneWaySearchResponse } from "@/lib/mock/itineraries";
import { SCORING_PRESETS } from "@/lib/scoring";

describe("search results client helpers", () => {
  it("preserves previous successful results when a new search fails", () => {
    const previous = applySuccessfulSearch(mockOneWaySearchResponse, {
      origin: "LIS",
      destination: "NRT",
      departureDate: "2026-11-14",
      passengers: 1,
      cabinClass: "ECONOMY",
    });

    const next = applyFailedSearch(previous);

    expect(next.itineraries).toEqual(previous.itineraries);
    expect(next.searchContext).toEqual(previous.searchContext);
  });

  it("replaces results after a successful search", () => {
    const previous = applySuccessfulSearch(mockOneWaySearchResponse, {
      origin: "LIS",
      destination: "NRT",
      departureDate: "2026-11-14",
      passengers: 1,
      cabinClass: "ECONOMY",
    });

    const next = applySuccessfulSearch(
      {
        ...mockOneWaySearchResponse,
        cached: true,
        results: [],
      },
      {
        origin: "MAD",
        destination: "JFK",
        departureDate: "2026-12-01",
        passengers: 2,
        cabinClass: "BUSINESS",
      },
    );

    expect(previous.itineraries.length).toBeGreaterThan(0);
    expect(next.itineraries).toEqual([]);
    expect(next.searchContext).toEqual({
      origin: "MAD",
      destination: "JFK",
      tripType: "One-way",
      resultCount: 0,
      cached: true,
    });
  });

  it("starts from an empty state before the first successful search", () => {
    expect(createEmptySearchResultsState()).toEqual({
      itineraries: [],
      searchContext: null,
    });
  });
});

describe("client-side reranking without network", () => {
  it("reranks when presets change", () => {
    const cheapest = scoreStoredItineraries(comparisonItineraries, {
      weights: SCORING_PRESETS.CHEAPEST,
      showTightConnections: false,
    });
    const fastest = scoreStoredItineraries(comparisonItineraries, {
      weights: SCORING_PRESETS.FASTEST,
      showTightConnections: false,
    });

    expect(cheapest[0]?.itinerary.id).toBe("cheap");
    expect(fastest[0]?.itinerary.id).toBe("fast-few-stops");
  });

  it("reranks when manual slider weights change", () => {
    const priceHeavy = scoreStoredItineraries(comparisonItineraries, {
      weights: { price: 10, stops: 0, duration: 0 },
      showTightConnections: false,
    });
    const durationHeavy = scoreStoredItineraries(comparisonItineraries, {
      weights: { price: 0, stops: 0, duration: 10 },
      showTightConnections: false,
    });

    expect(priceHeavy[0]?.itinerary.id).toBe("cheap");
    expect(durationHeavy[0]?.itinerary.id).toBe("fast-few-stops");
  });

  it("reranks when Show tight connections changes", () => {
    const hidden = scoreStoredItineraries(rankingItineraries, {
      weights: SCORING_PRESETS.BALANCED,
      showTightConnections: false,
    });
    const shown = scoreStoredItineraries(rankingItineraries, {
      weights: SCORING_PRESETS.BALANCED,
      showTightConnections: true,
    });

    expect(hidden.slice(0, 3).every((entry) => !entry.score.isRisky)).toBe(true);
    expect(hidden.slice(0, 5).some((entry) => entry.score.isRisky)).toBe(true);
    expect(
      shown.findIndex((entry) => entry.itinerary.id === "rank-risky-high"),
    ).toBeLessThan(
      hidden.findIndex((entry) => entry.itinerary.id === "rank-risky-high"),
    );
  });
});

describe("show more", () => {
  it("reveals additional already-scored results without changing the search payload", () => {
    const scored = scoreStoredItineraries(comparisonItineraries, {
      weights: SCORING_PRESETS.BALANCED,
      showTightConnections: true,
    });

    const padded = Array.from({ length: 35 }, (_, index) => scored[index % scored.length]);
    let visibleCount = INITIAL_VISIBLE_COUNT;

    expect(getVisibleScoredResults(padded, visibleCount)).toHaveLength(30);
    expect(shouldShowMoreControl(padded.length, visibleCount)).toBe(true);

    visibleCount = getNextVisibleCount(padded.length, visibleCount);

    expect(visibleCount).toBe(35);
    expect(getVisibleScoredResults(padded, visibleCount)).toHaveLength(35);
    expect(shouldShowMoreControl(padded.length, visibleCount)).toBe(false);
  });
});
