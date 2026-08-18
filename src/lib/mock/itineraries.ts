import type { SearchResponse } from "@/lib/types/search";

export const mockOneWaySearchResponse: SearchResponse = {
  currency: "EUR",
  searchId: "mock_search_oneway_001",
  cached: false,
  results: [
    {
      id: "itin_001",
      price: 842.5,
      totalDurationMinutes: 1065,
      stopCount: 1,
      outbound: {
        departureTime: "2026-11-14T10:25:00+00:00",
        arrivalTime: "2026-11-15T14:10:00+09:00",
        durationMinutes: 1065,
        segments: [
          {
            operatingCarrier: "AF",
            marketingCarrier: "AF",
            flightNumber: "1025",
            from: "LIS",
            to: "CDG",
            departureTime: "2026-11-14T10:25:00+00:00",
            arrivalTime: "2026-11-14T14:05:00+01:00",
            durationMinutes: 160,
          },
          {
            operatingCarrier: "AF",
            marketingCarrier: "AF",
            flightNumber: "276",
            from: "CDG",
            to: "NRT",
            departureTime: "2026-11-14T15:40:00+01:00",
            arrivalTime: "2026-11-15T14:10:00+09:00",
            durationMinutes: 810,
          },
        ],
        layovers: [
          {
            airport: "CDG",
            durationMinutes: 95,
            airportChange: false,
            connectionType: "INTERNATIONAL",
          },
        ],
      },
      inbound: null,
      dealReference: "mock-deal-ref-oneway-001",
    },
  ],
};

export const mockRoundTripSearchResponse: SearchResponse = {
  currency: "EUR",
  searchId: "mock_search_roundtrip_001",
  cached: false,
  results: [
    {
      id: "itin_002",
      price: 1489.0,
      totalDurationMinutes: 2140,
      stopCount: 2,
      outbound: {
        departureTime: "2026-11-14T08:15:00+00:00",
        arrivalTime: "2026-11-15T06:30:00+09:00",
        durationMinutes: 1035,
        segments: [
          {
            operatingCarrier: "TP",
            marketingCarrier: "TP",
            flightNumber: "208",
            from: "LIS",
            to: "FRA",
            departureTime: "2026-11-14T08:15:00+00:00",
            arrivalTime: "2026-11-14T12:05:00+01:00",
            durationMinutes: 170,
          },
          {
            operatingCarrier: "NH",
            marketingCarrier: "NH",
            flightNumber: "204",
            from: "FRA",
            to: "NRT",
            departureTime: "2026-11-14T13:35:00+01:00",
            arrivalTime: "2026-11-15T06:30:00+09:00",
            durationMinutes: 775,
          },
        ],
        layovers: [
          {
            airport: "FRA",
            durationMinutes: 90,
            airportChange: false,
            connectionType: "INTERNATIONAL",
          },
        ],
      },
      inbound: {
        departureTime: "2026-11-28T11:00:00+09:00",
        arrivalTime: "2026-11-28T22:40:00+00:00",
        durationMinutes: 1105,
        segments: [
          {
            operatingCarrier: "NH",
            marketingCarrier: "NH",
            flightNumber: "205",
            from: "NRT",
            to: "FRA",
            departureTime: "2026-11-28T11:00:00+09:00",
            arrivalTime: "2026-11-28T15:45:00+01:00",
            durationMinutes: 765,
          },
          {
            operatingCarrier: "TP",
            marketingCarrier: "TP",
            flightNumber: "579",
            from: "FRA",
            to: "LIS",
            departureTime: "2026-11-28T17:20:00+01:00",
            arrivalTime: "2026-11-28T22:40:00+00:00",
            durationMinutes: 200,
          },
        ],
        layovers: [
          {
            airport: "FRA",
            durationMinutes: 95,
            airportChange: false,
            connectionType: "INTERNATIONAL",
          },
        ],
      },
      dealReference: "mock-deal-ref-roundtrip-002",
    },
  ],
};

export const mockSearchResponses = [
  mockOneWaySearchResponse,
  mockRoundTripSearchResponse,
] as const;

export const mockItineraryCount = mockSearchResponses.reduce(
  (total, response) => total + response.results.length,
  0,
);
