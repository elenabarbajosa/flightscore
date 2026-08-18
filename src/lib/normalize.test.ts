import { describe, expect, it } from "vitest";

import {
  airportChangeFixture,
  deterministicIdFixture,
  domesticConnectionFixture,
  internationalConnectionFixture,
  longLayoverFixture,
  missingOperatingCarrierFixture,
  missingRequiredFieldsFixture,
  mixedValidityFixture,
  oneWayFixture,
  roundTripFixture,
  schengenConnectionFixture,
  timestampCalculationFixture,
  tooManyStopsFixture,
} from "@/lib/fixtures/provider-search-results";
import { normalizeProviderSearchResult } from "@/lib/normalize";

const ISO_WITH_OFFSET_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

describe("normalizeProviderSearchResult", () => {
  it("normalizes a one-way itinerary", () => {
    const result = normalizeProviderSearchResult(oneWayFixture);

    expect(result.currency).toBe("EUR");
    expect(result.results).toHaveLength(1);

    const itinerary = result.results[0];

    expect(itinerary.inbound).toBeNull();
    expect(itinerary.stopCount).toBe(1);
    expect(itinerary.price).toBe(842.5);
    expect(itinerary.dealReference).toBe("deal-oneway-001");
    expect(itinerary.outbound.segments).toHaveLength(2);
    expect(itinerary.outbound.layovers[0]?.connectionType).toBe("INTERNATIONAL");
  });

  it("normalizes a round-trip itinerary", () => {
    const result = normalizeProviderSearchResult(roundTripFixture);
    const itinerary = result.results[0];

    expect(itinerary.inbound).not.toBeNull();
    expect(itinerary.stopCount).toBe(2);
    expect(itinerary.totalDurationMinutes).toBeGreaterThan(0);
    expect(itinerary.inbound?.layovers[0]?.connectionType).toBe("INTERNATIONAL");
    expect(itinerary.dealReference).toBe("deal-roundtrip-002");
  });

  it("classifies a domestic connection", () => {
    const result = normalizeProviderSearchResult(domesticConnectionFixture);

    expect(result.results[0]?.outbound.layovers[0]).toMatchObject({
      airport: "MUC",
      airportChange: false,
      connectionType: "DOMESTIC",
    });
  });

  it("classifies a Schengen connection", () => {
    const result = normalizeProviderSearchResult(schengenConnectionFixture);

    expect(result.results[0]?.outbound.layovers[0]).toMatchObject({
      airport: "FRA",
      connectionType: "SCHENGEN",
    });
  });

  it("classifies an international connection", () => {
    const result = normalizeProviderSearchResult(internationalConnectionFixture);

    expect(result.results[0]?.outbound.layovers[0]).toMatchObject({
      airport: "JFK",
      connectionType: "INTERNATIONAL",
    });
  });

  it("detects an airport change independently of connection type", () => {
    const result = normalizeProviderSearchResult(airportChangeFixture);

    expect(result.results[0]?.outbound.layovers[0]).toMatchObject({
      airport: "CDG",
      airportChange: true,
      connectionType: "INTERNATIONAL",
    });
  });

  it("calculates a long layover duration from timestamps", () => {
    const result = normalizeProviderSearchResult(longLayoverFixture);
    const layover = result.results[0]?.outbound.layovers[0];

    expect(layover).toBeDefined();
    expect(layover?.durationMinutes).toBeGreaterThan(300);
  });

  it("falls back to marketingCarrier when operatingCarrier is missing", () => {
    const result = normalizeProviderSearchResult(missingOperatingCarrierFixture);
    const segment = result.results[0]?.outbound.segments[0];

    expect(segment?.operatingCarrier).toBe("UX");
    expect(segment?.marketingCarrier).toBe("UX");
  });

  it("rejects itineraries with more than two stops in one direction", () => {
    const result = normalizeProviderSearchResult(tooManyStopsFixture);

    expect(result.results).toHaveLength(0);
  });

  it("rejects itineraries missing scoring-required fields", () => {
    const result = normalizeProviderSearchResult(missingRequiredFieldsFixture);

    expect(result.results).toHaveLength(0);
  });

  it("filters invalid offers without failing the whole search", () => {
    const result = normalizeProviderSearchResult(mixedValidityFixture);

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.outbound.segments).toHaveLength(1);
  });

  it("generates deterministic itinerary IDs from normalized content", () => {
    const result = normalizeProviderSearchResult(deterministicIdFixture);
    const [first, second] = result.results;

    expect(first?.id).toBe(second?.id);
    expect(first?.id).toMatch(/^[a-f0-9]{16}$/);
    expect(first?.id).not.toBe("provider-id-not-used");
  });

  it("normalizes timestamps and computes layover duration authoritatively", () => {
    const result = normalizeProviderSearchResult(timestampCalculationFixture);
    const itinerary = result.results[0];

    expect(itinerary).toBeDefined();

    for (const segment of itinerary.outbound.segments) {
      expect(segment.departureTime).toMatch(ISO_WITH_OFFSET_PATTERN);
      expect(segment.arrivalTime).toMatch(ISO_WITH_OFFSET_PATTERN);
    }

    expect(itinerary.outbound.layovers[0]?.durationMinutes).toBe(95);
    expect(itinerary.outbound.layovers[0]?.durationMinutes).not.toBe(999);
  });
});
