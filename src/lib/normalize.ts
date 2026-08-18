import { createHash } from "node:crypto";

import { Temporal } from "@js-temporal/polyfill";

import { getAirportByIata } from "@/lib/airport-metadata";
import type {
  ProviderItinerary,
  ProviderJourney,
  ProviderLayoverHint,
  ProviderSearchResult,
  ProviderSegment,
} from "@/lib/provider/types";
import { isSchengenCountry } from "@/lib/schengen";
import type {
  ConnectionType,
  Itinerary,
  Journey,
  Layover,
  Segment,
} from "@/lib/types/search";

const MAX_STOPS_PER_DIRECTION = 2;
const LAYOVER_CROSS_CHECK_TOLERANCE_MINUTES = 2;
const PROVIDER_WALL_CLOCK_PATTERN = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/;

export interface NormalizedSearchPayload {
  currency: "EUR";
  results: Itinerary[];
}

export function normalizeProviderSearchResult(
  result: ProviderSearchResult,
): NormalizedSearchPayload {
  const results = result.itineraries
    .map((itinerary) => normalizeItinerary(itinerary))
    .filter((itinerary): itinerary is Itinerary => itinerary !== null);

  return {
    currency: "EUR",
    results,
  };
}

function normalizeItinerary(
  providerItinerary: ProviderItinerary,
): Itinerary | null {
  if (providerItinerary.currency !== "EUR") {
    return null;
  }

  if (!isValidPrice(providerItinerary.price)) {
    return null;
  }

  const outbound = normalizeJourney(providerItinerary.outbound);
  if (!outbound) {
    return null;
  }

  if (countStops(outbound) > MAX_STOPS_PER_DIRECTION) {
    return null;
  }

  const inbound = providerItinerary.inbound
    ? normalizeJourney(providerItinerary.inbound)
    : null;

  if (providerItinerary.inbound && !inbound) {
    return null;
  }

  if (inbound && countStops(inbound) > MAX_STOPS_PER_DIRECTION) {
    return null;
  }

  const stopCount = countStops(outbound) + (inbound ? countStops(inbound) : 0);
  const totalDurationMinutes =
    outbound.durationMinutes + (inbound?.durationMinutes ?? 0);

  const itinerary: Itinerary = {
    id: "",
    price: providerItinerary.price,
    totalDurationMinutes,
    stopCount,
    outbound,
    inbound,
    dealReference: providerItinerary.dealReference,
  };

  itinerary.id = createDeterministicItineraryId(itinerary);

  return itinerary;
}

function normalizeJourney(
  journey: ProviderJourney,
  layoverHints: ProviderLayoverHint[] = journey.layoverHints,
): Journey | null {
  if (journey.segments.length === 0) {
    return null;
  }

  const segments: Segment[] = [];

  for (const providerSegment of journey.segments) {
    const segment = normalizeSegment(providerSegment);
    if (!segment) {
      return null;
    }
    segments.push(segment);
  }

  const layovers = buildLayovers(segments, layoverHints);
  if (layovers === null) {
    return null;
  }

  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const departureInstant = parseIsoTimestamp(firstSegment.departureTime);
  const arrivalInstant = parseIsoTimestamp(lastSegment.arrivalTime);

  if (!departureInstant || !arrivalInstant) {
    return null;
  }

  const durationMinutes = elapsedMinutes(departureInstant, arrivalInstant);

  if (durationMinutes <= 0) {
    return null;
  }

  return {
    departureTime: firstSegment.departureTime,
    arrivalTime: lastSegment.arrivalTime,
    durationMinutes,
    segments,
    layovers,
  };
}

function normalizeSegment(providerSegment: ProviderSegment): Segment | null {
  const marketingCarrier = providerSegment.marketingCarrier.trim();
  const operatingCarrier = providerSegment.operatingCarrier.trim();
  const resolvedOperatingCarrier = operatingCarrier || marketingCarrier;

  if (!resolvedOperatingCarrier || !marketingCarrier) {
    return null;
  }

  if (!providerSegment.flightNumber.trim()) {
    return null;
  }

  if (
    !isValidDuration(providerSegment.durationMinutes) ||
    !getAirportByIata(providerSegment.from) ||
    !getAirportByIata(providerSegment.to)
  ) {
    return null;
  }

  const departureTime = normalizeWallClockTimestamp(
    providerSegment.departureTime,
    providerSegment.from,
  );
  const arrivalTime = normalizeWallClockTimestamp(
    providerSegment.arrivalTime,
    providerSegment.to,
  );

  if (!departureTime || !arrivalTime) {
    return null;
  }

  const departureInstant = parseIsoTimestamp(departureTime);
  const arrivalInstant = parseIsoTimestamp(arrivalTime);

  if (!departureInstant || !arrivalInstant) {
    return null;
  }

  const durationMinutes = elapsedMinutes(departureInstant, arrivalInstant);

  if (durationMinutes <= 0) {
    return null;
  }

  return {
    operatingCarrier: resolvedOperatingCarrier,
    marketingCarrier,
    flightNumber: providerSegment.flightNumber.trim(),
    from: providerSegment.from.trim().toUpperCase(),
    to: providerSegment.to.trim().toUpperCase(),
    departureTime,
    arrivalTime,
    durationMinutes,
  };
}

function buildLayovers(
  segments: Segment[],
  layoverHints: ProviderLayoverHint[],
): Layover[] | null {
  if (segments.length <= 1) {
    return [];
  }

  const layovers: Layover[] = [];

  for (let index = 0; index < segments.length - 1; index += 1) {
    const currentSegment = segments[index];
    const nextSegment = segments[index + 1];
    const arrivalInstant = parseIsoTimestamp(currentSegment.arrivalTime);
    const departureInstant = parseIsoTimestamp(nextSegment.departureTime);

    if (!arrivalInstant || !departureInstant) {
      return null;
    }

    const durationMinutes = elapsedMinutes(arrivalInstant, departureInstant);

    if (durationMinutes < 0) {
      return null;
    }

    const hint = findLayoverHint(
      layoverHints,
      currentSegment.to,
      nextSegment.from,
    );

    if (
      hint &&
      Math.abs(durationMinutes - hint.durationMinutes) >
        LAYOVER_CROSS_CHECK_TOLERANCE_MINUTES
    ) {
      // Provider hint differs; computed elapsed time remains authoritative.
    }

    const connectionType = classifyConnection(
      currentSegment,
      nextSegment,
    );

    if (!connectionType) {
      return null;
    }

    layovers.push({
      airport: currentSegment.to,
      durationMinutes,
      airportChange: currentSegment.to !== nextSegment.from,
      connectionType,
    });
  }

  return layovers;
}

function findLayoverHint(
  layoverHints: ProviderLayoverHint[],
  arrivalAirport: string,
  departureAirport: string,
): ProviderLayoverHint | undefined {
  return layoverHints.find((hint) => {
    const normalizedHintAirport = hint.airport.trim().toUpperCase();

    return (
      normalizedHintAirport === arrivalAirport ||
      normalizedHintAirport === departureAirport
    );
  });
}

function classifyConnection(
  incomingSegment: Segment,
  outgoingSegment: Segment,
): ConnectionType | null {
  const relevantAirports = [
    incomingSegment.from,
    incomingSegment.to,
    outgoingSegment.from,
    outgoingSegment.to,
  ];

  const countryCodes = relevantAirports.map((airportIata) => {
    return getAirportByIata(airportIata)?.countryCode ?? null;
  });

  if (countryCodes.some((countryCode) => !countryCode)) {
    return null;
  }

  const uniqueCountryCodes = new Set(countryCodes);

  if (uniqueCountryCodes.size === 1) {
    return "DOMESTIC";
  }

  if (countryCodes.every((countryCode) => isSchengenCountry(countryCode!))) {
    return "SCHENGEN";
  }

  return "INTERNATIONAL";
}

function normalizeWallClockTimestamp(
  value: string,
  airportIata: string,
): string | null {
  const airport = getAirportByIata(airportIata);

  if (!airport) {
    return null;
  }

  const match = value.trim().match(PROVIDER_WALL_CLOCK_PATTERN);

  if (!match) {
    return null;
  }

  try {
    const plainDateTime = Temporal.PlainDateTime.from(
      `${match[1]}T${match[2]}:00`,
    );
    const zonedDateTime = plainDateTime.toZonedDateTime(airport.timeZone);

    return formatZonedDateTime(zonedDateTime);
  } catch {
    return null;
  }
}

function formatZonedDateTime(zonedDateTime: Temporal.ZonedDateTime): string {
  return `${zonedDateTime.toPlainDateTime().toString()}${zonedDateTime.offset}`;
}

function elapsedMinutes(
  earlier: Temporal.Instant,
  later: Temporal.Instant,
): number {
  const duration = earlier.until(later, { largestUnit: "minute" });
  return duration.total({ unit: "minute" });
}

function parseIsoTimestamp(value: string): Temporal.Instant | null {
  try {
    return Temporal.Instant.from(value);
  } catch {
    try {
      const zonedDateTime = Temporal.ZonedDateTime.from(value);
      return zonedDateTime.toInstant();
    } catch {
      return null;
    }
  }
}

function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price > 0;
}

function isValidDuration(durationMinutes: number): boolean {
  return Number.isFinite(durationMinutes) && durationMinutes > 0;
}

function countStops(journey: Journey): number {
  return Math.max(0, journey.segments.length - 1);
}

function createDeterministicItineraryId(itinerary: Itinerary): string {
  const outboundSignature = itinerary.outbound.segments
    .map(
      (segment) =>
        [
          segment.from,
          segment.to,
          segment.departureTime,
          segment.arrivalTime,
          segment.flightNumber,
        ].join(":"),
    )
    .join("|");

  const inboundSignature = itinerary.inbound
    ? itinerary.inbound.segments
        .map(
          (segment) =>
            [
              segment.from,
              segment.to,
              segment.departureTime,
              segment.arrivalTime,
              segment.flightNumber,
            ].join(":"),
        )
        .join("|")
    : "ONE_WAY";

  return createHash("sha256")
    .update(
      [
        itinerary.inbound ? "round-trip" : "one-way",
        outboundSignature,
        inboundSignature,
        String(itinerary.price),
        itinerary.outbound.departureTime,
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 16);
}
