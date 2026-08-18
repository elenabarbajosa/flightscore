import type { Itinerary, Journey, Layover } from "@/lib/types/search";

export function createEmptyJourney(): Journey {
  return {
    departureTime: "2026-11-14T08:00:00+00:00",
    arrivalTime: "2026-11-14T10:00:00+00:00",
    durationMinutes: 120,
    segments: [
      {
        operatingCarrier: "TP",
        marketingCarrier: "TP",
        flightNumber: "100",
        from: "LIS",
        to: "NRT",
        departureTime: "2026-11-14T08:00:00+00:00",
        arrivalTime: "2026-11-14T10:00:00+00:00",
        durationMinutes: 120,
      },
    ],
    layovers: [],
  };
}

export function createLayover(
  overrides: Partial<Layover> & Pick<Layover, "durationMinutes" | "connectionType">,
): Layover {
  return {
    airport: "FRA",
    airportChange: false,
    ...overrides,
  };
}

export function createScoringItinerary(
  overrides: Partial<Itinerary> & Pick<Itinerary, "id">,
): Itinerary {
  const outbound = overrides.outbound ?? createEmptyJourney();

  return {
    price: 500,
    totalDurationMinutes: outbound.durationMinutes,
    stopCount: Math.max(0, outbound.segments.length - 1),
    inbound: null,
    dealReference: null,
    ...overrides,
    outbound,
  };
}

function journeyWithLayover(
  layover: Layover,
  segmentCount = 2,
): Journey {
  const journey = createEmptyJourney();

  journey.segments = Array.from({ length: segmentCount }, (_, index) => ({
    ...journey.segments[0],
    flightNumber: String(100 + index),
    from: index === 0 ? "LIS" : layover.airport,
    to: index === segmentCount - 1 ? "NRT" : layover.airport,
  }));
  journey.layovers = [layover];

  return journey;
}

export const comparisonItineraries = [
  createScoringItinerary({
    id: "cheap",
    price: 400,
    totalDurationMinutes: 1000,
    stopCount: 1,
  }),
  createScoringItinerary({
    id: "mid",
    price: 600,
    totalDurationMinutes: 800,
    stopCount: 1,
  }),
  createScoringItinerary({
    id: "fast-few-stops",
    price: 900,
    totalDurationMinutes: 600,
    stopCount: 0,
  }),
];

export const equalValueItineraries = [
  createScoringItinerary({
    id: "equal-a",
    price: 500,
    totalDurationMinutes: 800,
    stopCount: 1,
  }),
  createScoringItinerary({
    id: "equal-b",
    price: 500,
    totalDurationMinutes: 800,
    stopCount: 1,
  }),
];

export const domesticRiskyItinerary = createScoringItinerary({
  id: "domestic-risky",
  outbound: journeyWithLayover(
    createLayover({
      airport: "MUC",
      durationMinutes: 59,
      connectionType: "DOMESTIC",
    }),
  ),
});

export const domesticSafeItinerary = createScoringItinerary({
  id: "domestic-safe",
  outbound: journeyWithLayover(
    createLayover({
      airport: "MUC",
      durationMinutes: 60,
      connectionType: "DOMESTIC",
    }),
  ),
});

export const schengenRiskyItinerary = createScoringItinerary({
  id: "schengen-risky",
  outbound: journeyWithLayover(
    createLayover({
      airport: "FRA",
      durationMinutes: 59,
      connectionType: "SCHENGEN",
    }),
  ),
});

export const internationalRiskyItinerary = createScoringItinerary({
  id: "international-risky",
  outbound: journeyWithLayover(
    createLayover({
      airport: "JFK",
      durationMinutes: 89,
      connectionType: "INTERNATIONAL",
    }),
  ),
});

export const internationalSafeItinerary = createScoringItinerary({
  id: "international-safe",
  outbound: journeyWithLayover(
    createLayover({
      airport: "JFK",
      durationMinutes: 90,
      connectionType: "INTERNATIONAL",
    }),
  ),
});

export const airportChangeItinerary = createScoringItinerary({
  id: "airport-change",
  outbound: journeyWithLayover(
    createLayover({
      airport: "CDG",
      durationMinutes: 120,
      connectionType: "DOMESTIC",
      airportChange: true,
    }),
  ),
});

export const longLayoverItinerary = createScoringItinerary({
  id: "long-layover",
  outbound: journeyWithLayover(
    createLayover({
      airport: "FRA",
      durationMinutes: 301,
      connectionType: "SCHENGEN",
    }),
  ),
});

export const exactLongLayoverItinerary = createScoringItinerary({
  id: "exact-long-layover",
  outbound: journeyWithLayover(
    createLayover({
      airport: "FRA",
      durationMinutes: 300,
      connectionType: "SCHENGEN",
    }),
  ),
});

export const multiPenaltyItinerary = createScoringItinerary({
  id: "multi-penalty",
  outbound: journeyWithLayover(
    createLayover({
      airport: "CDG",
      durationMinutes: 45,
      connectionType: "SCHENGEN",
      airportChange: true,
    }),
  ),
});

export const roundTripPenaltyItinerary = createScoringItinerary({
  id: "round-trip-penalties",
  inbound: journeyWithLayover(
    createLayover({
      airport: "FRA",
      durationMinutes: 45,
      connectionType: "SCHENGEN",
    }),
  ),
  outbound: journeyWithLayover(
    createLayover({
      airport: "FRA",
      durationMinutes: 301,
      connectionType: "SCHENGEN",
    }),
  ),
  totalDurationMinutes: 1600,
  stopCount: 2,
});


export const rankingItineraries = [
  createScoringItinerary({
    id: "rank-safe-high",
    price: 500,
    totalDurationMinutes: 700,
    stopCount: 0,
    outbound: createEmptyJourney(),
  }),
  createScoringItinerary({
    id: "rank-safe-mid",
    price: 550,
    totalDurationMinutes: 750,
    stopCount: 0,
    outbound: createEmptyJourney(),
  }),
  createScoringItinerary({
    id: "rank-safe-low",
    price: 600,
    totalDurationMinutes: 800,
    stopCount: 0,
    outbound: createEmptyJourney(),
  }),
  createScoringItinerary({
    id: "rank-risky-high",
    outbound: journeyWithLayover(
      createLayover({
        airport: "FRA",
        durationMinutes: 45,
        connectionType: "SCHENGEN",
      }),
    ),
    price: 450,
    totalDurationMinutes: 650,
    stopCount: 1,
  }),
  createScoringItinerary({
    id: "rank-risky-mid",
    outbound: journeyWithLayover(
      createLayover({
        airport: "FRA",
        durationMinutes: 45,
        connectionType: "SCHENGEN",
      }),
    ),
    price: 480,
    totalDurationMinutes: 680,
    stopCount: 1,
  }),
  createScoringItinerary({
    id: "rank-risky-low",
    outbound: journeyWithLayover(
      createLayover({
        airport: "FRA",
        durationMinutes: 45,
        connectionType: "SCHENGEN",
      }),
    ),
    price: 520,
    totalDurationMinutes: 720,
    stopCount: 1,
  }),
];

export const exactTieItineraries = [
  createScoringItinerary({
    id: "exact-tie-first",
    price: 500,
    totalDurationMinutes: 800,
    stopCount: 1,
  }),
  createScoringItinerary({
    id: "exact-tie-second",
    price: 500,
    totalDurationMinutes: 800,
    stopCount: 1,
  }),
];
