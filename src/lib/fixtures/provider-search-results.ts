import type {
  ProviderItinerary,
  ProviderJourney,
  ProviderSearchResult,
  ProviderSegment,
} from "@/lib/provider/types";

function segment(
  overrides: Partial<ProviderSegment> & Pick<ProviderSegment, "from" | "to">,
): ProviderSegment {
  return {
    operatingCarrier: "TP",
    marketingCarrier: "TP",
    flightNumber: "100",
    departureTime: "2026-11-14 08:15",
    arrivalTime: "2026-11-14 12:05",
    durationMinutes: 170,
    ...overrides,
  };
}

function journey(
  segments: ProviderSegment[],
  layoverHints: ProviderJourney["layoverHints"] = [],
  durationMinutes?: number,
): ProviderJourney {
  return {
    departureTime: segments[0]?.departureTime ?? "",
    arrivalTime: segments[segments.length - 1]?.arrivalTime ?? "",
    durationMinutes:
      durationMinutes ??
      segments.reduce((total, current) => total + current.durationMinutes, 0),
    segments,
    layoverHints,
  };
}

function itinerary(
  overrides: Partial<ProviderItinerary> & Pick<ProviderItinerary, "outbound">,
): ProviderItinerary {
  const outbound = overrides.outbound;
  const inbound = overrides.inbound ?? null;
  const outboundStops = Math.max(0, outbound.segments.length - 1);
  const inboundStops = inbound ? Math.max(0, inbound.segments.length - 1) : 0;

  return {
    id: "provider-id-not-used",
    price: 500,
    currency: "EUR",
    totalDurationMinutes:
      outbound.durationMinutes + (inbound?.durationMinutes ?? 0),
    stopCount: outboundStops + inboundStops,
    inbound,
    dealReference: "fixture-deal-ref",
    ...overrides,
    outbound,
  };
}

export const oneWayFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      price: 842.5,
      outbound: journey(
        [
          segment({
            operatingCarrier: "AF",
            marketingCarrier: "AF",
            flightNumber: "1025",
            from: "LIS",
            to: "CDG",
            departureTime: "2026-11-14 10:25",
            arrivalTime: "2026-11-14 14:05",
            durationMinutes: 160,
          }),
          segment({
            operatingCarrier: "AF",
            marketingCarrier: "AF",
            flightNumber: "276",
            from: "CDG",
            to: "NRT",
            departureTime: "2026-11-14 15:40",
            arrivalTime: "2026-11-15 13:10",
            durationMinutes: 810,
          }),
        ],
        [{ airport: "CDG", durationMinutes: 95 }],
        1065,
      ),
      dealReference: "deal-oneway-001",
    }),
  ],
};

export const roundTripFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      price: 1489,
      outbound: journey(
        [
          segment({
            operatingCarrier: "TP",
            marketingCarrier: "TP",
            flightNumber: "208",
            from: "LIS",
            to: "FRA",
            departureTime: "2026-11-14 08:15",
            arrivalTime: "2026-11-14 12:05",
            durationMinutes: 170,
          }),
          segment({
            operatingCarrier: "NH",
            marketingCarrier: "NH",
            flightNumber: "204",
            from: "FRA",
            to: "NRT",
            departureTime: "2026-11-14 13:35",
            arrivalTime: "2026-11-15 06:30",
            durationMinutes: 775,
          }),
        ],
        [{ airport: "FRA", durationMinutes: 90 }],
        1035,
      ),
      inbound: journey(
        [
          segment({
            operatingCarrier: "NH",
            marketingCarrier: "NH",
            flightNumber: "205",
            from: "NRT",
            to: "FRA",
            departureTime: "2026-11-28 11:00",
            arrivalTime: "2026-11-28 15:45",
            durationMinutes: 765,
          }),
          segment({
            operatingCarrier: "TP",
            marketingCarrier: "TP",
            flightNumber: "579",
            from: "FRA",
            to: "LIS",
            departureTime: "2026-11-28 17:20",
            arrivalTime: "2026-11-28 22:40",
            durationMinutes: 200,
          }),
        ],
        [{ airport: "FRA", durationMinutes: 95 }],
        1105,
      ),
      dealReference: "deal-roundtrip-002",
    }),
  ],
};

export const domesticConnectionFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      outbound: journey(
        [
          segment({
            from: "FRA",
            to: "MUC",
            departureTime: "2026-11-14 08:00",
            arrivalTime: "2026-11-14 09:05",
            durationMinutes: 65,
          }),
          segment({
            from: "MUC",
            to: "BER",
            departureTime: "2026-11-14 11:00",
            arrivalTime: "2026-11-14 12:15",
            durationMinutes: 75,
          }),
        ],
        [{ airport: "MUC", durationMinutes: 115 }],
      ),
    }),
  ],
};

export const schengenConnectionFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      outbound: journey(
        [
          segment({
            from: "LIS",
            to: "FRA",
            departureTime: "2026-11-14 08:15",
            arrivalTime: "2026-11-14 12:05",
            durationMinutes: 170,
          }),
          segment({
            from: "FRA",
            to: "MAD",
            departureTime: "2026-11-14 13:35",
            arrivalTime: "2026-11-14 16:30",
            durationMinutes: 175,
          }),
        ],
        [{ airport: "FRA", durationMinutes: 90 }],
      ),
    }),
  ],
};

export const internationalConnectionFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      outbound: journey(
        [
          segment({
            from: "LHR",
            to: "JFK",
            departureTime: "2026-11-14 10:00",
            arrivalTime: "2026-11-14 13:00",
            durationMinutes: 480,
          }),
          segment({
            from: "JFK",
            to: "NRT",
            departureTime: "2026-11-14 18:00",
            arrivalTime: "2026-11-15 22:00",
            durationMinutes: 840,
          }),
        ],
        [{ airport: "JFK", durationMinutes: 300 }],
      ),
    }),
  ],
};

export const airportChangeFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      outbound: journey(
        [
          segment({
            from: "LIS",
            to: "CDG",
            departureTime: "2026-11-14 08:15",
            arrivalTime: "2026-11-14 12:05",
            durationMinutes: 170,
          }),
          segment({
            from: "ORY",
            to: "NRT",
            departureTime: "2026-11-14 15:40",
            arrivalTime: "2026-11-15 14:10",
            durationMinutes: 810,
          }),
        ],
        [{ airport: "CDG", durationMinutes: 215 }],
      ),
    }),
  ],
};

export const longLayoverFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      outbound: journey(
        [
          segment({
            from: "LIS",
            to: "FRA",
            departureTime: "2026-11-14 08:15",
            arrivalTime: "2026-11-14 12:05",
            durationMinutes: 170,
          }),
          segment({
            from: "FRA",
            to: "NRT",
            departureTime: "2026-11-14 21:00",
            arrivalTime: "2026-11-15 15:30",
            durationMinutes: 750,
          }),
        ],
        [{ airport: "FRA", durationMinutes: 535 }],
      ),
    }),
  ],
};

export const missingOperatingCarrierFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      outbound: journey([
        segment({
          operatingCarrier: "",
          marketingCarrier: "UX",
          flightNumber: "1015",
          from: "LIS",
          to: "MAD",
          departureTime: "2026-11-14 09:00",
          arrivalTime: "2026-11-14 11:15",
          durationMinutes: 75,
        }),
      ]),
    }),
  ],
};

export const tooManyStopsFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      outbound: journey([
        segment({ from: "LIS", to: "FRA" }),
        segment({ from: "FRA", to: "MUC" }),
        segment({ from: "MUC", to: "VIE" }),
        segment({ from: "VIE", to: "NRT" }),
      ]),
    }),
  ],
};

export const missingRequiredFieldsFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      price: Number.NaN,
      outbound: journey([
        segment({
          from: "LIS",
          to: "NRT",
          flightNumber: "",
        }),
      ]),
    }),
  ],
};

export const mixedValidityFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      outbound: journey([
        segment({
          from: "LIS",
          to: "NRT",
          departureTime: "2026-11-14 09:00",
          arrivalTime: "2026-11-15 08:00",
          durationMinutes: 1380,
        }),
      ]),
    }),
    itinerary({
      outbound: journey([
        segment({ from: "LIS", to: "FRA" }),
        segment({ from: "FRA", to: "MUC" }),
        segment({ from: "MUC", to: "VIE" }),
        segment({ from: "VIE", to: "NRT" }),
      ]),
    }),
  ],
};

export const deterministicIdFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      price: 321,
      dealReference: "first",
      outbound: journey([
        segment({
          from: "LIS",
          to: "MAD",
          departureTime: "2026-11-14 09:00",
          arrivalTime: "2026-11-14 11:15",
          durationMinutes: 75,
        }),
      ]),
    }),
    itinerary({
      price: 321,
      dealReference: "second",
      outbound: journey([
        segment({
          from: "LIS",
          to: "MAD",
          departureTime: "2026-11-14 09:00",
          arrivalTime: "2026-11-14 11:15",
          durationMinutes: 75,
        }),
      ]),
    }),
  ],
};

export const timestampCalculationFixture: ProviderSearchResult = {
  currency: "EUR",
  itineraries: [
    itinerary({
      outbound: journey(
        [
          segment({
            from: "LIS",
            to: "CDG",
            departureTime: "2026-11-14 10:25",
            arrivalTime: "2026-11-14 14:05",
            durationMinutes: 160,
          }),
          segment({
            from: "CDG",
            to: "NRT",
            departureTime: "2026-11-14 15:40",
            arrivalTime: "2026-11-15 13:10",
            durationMinutes: 810,
          }),
        ],
        [{ airport: "CDG", durationMinutes: 999 }],
      ),
    }),
  ],
};
