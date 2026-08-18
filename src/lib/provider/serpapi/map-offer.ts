import { createHash } from "node:crypto";

import { REQUESTED_CURRENCY } from "@/lib/provider/constants";
import type {
  ProviderItinerary,
  ProviderJourney,
  ProviderLayoverHint,
  ProviderSegment,
} from "@/lib/provider/types";
import type {
  SerpApiFlightOffer,
  SerpApiFlightSegment,
  SerpApiLayover,
} from "@/lib/provider/serpapi/types";

interface ParsedFlightNumber {
  marketingCarrier: string;
  flightNumber: string;
}

function parseFlightNumber(rawFlightNumber: string): ParsedFlightNumber {
  const normalized = rawFlightNumber.trim().replace(/\s+/g, " ");
  const match = normalized.match(/^([A-Z0-9]{2})\s*(\d+[A-Z]?)$/i);

  if (!match) {
    return {
      marketingCarrier: "XX",
      flightNumber: normalized.replace(/\s+/g, ""),
    };
  }

  return {
    marketingCarrier: match[1].toUpperCase(),
    flightNumber: match[2],
  };
}

function mapSegment(segment: SerpApiFlightSegment): ProviderSegment {
  const { marketingCarrier, flightNumber } = parseFlightNumber(
    segment.flight_number,
  );

  return {
    operatingCarrier: marketingCarrier,
    marketingCarrier,
    flightNumber,
    from: segment.departure_airport.id,
    to: segment.arrival_airport.id,
    departureTime: segment.departure_airport.time,
    arrivalTime: segment.arrival_airport.time,
    durationMinutes: segment.duration,
  };
}

function mapLayoverHints(layovers: SerpApiLayover[] = []): ProviderLayoverHint[] {
  return layovers.map((layover) => ({
    airport: layover.id,
    durationMinutes: layover.duration,
    overnight: layover.overnight,
  }));
}

export function mapSerpApiOfferToJourney(offer: SerpApiFlightOffer): ProviderJourney {
  const segments = offer.flights.map(mapSegment);
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  return {
    departureTime: firstSegment.departureTime,
    arrivalTime: lastSegment.arrivalTime,
    durationMinutes: offer.total_duration,
    segments,
    layoverHints: mapLayoverHints(offer.layovers),
  };
}

function countStops(journey: ProviderJourney): number {
  return Math.max(0, journey.segments.length - 1);
}

function createItineraryId(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
}

export function mapOneWayItinerary(offer: SerpApiFlightOffer): ProviderItinerary {
  const outbound = mapSerpApiOfferToJourney(offer);

  return {
    id: createItineraryId([
      "one-way",
      outbound.segments.map((segment) => segment.from + segment.to).join("-"),
      String(offer.price),
      outbound.departureTime,
    ]),
    price: offer.price,
    currency: REQUESTED_CURRENCY,
    totalDurationMinutes: outbound.durationMinutes,
    stopCount: countStops(outbound),
    outbound,
    inbound: null,
    dealReference: offer.booking_token ?? null,
  };
}

export function mapRoundTripItinerary(
  outboundOffer: SerpApiFlightOffer,
  returnOffer: SerpApiFlightOffer,
): ProviderItinerary {
  const outbound = mapSerpApiOfferToJourney(outboundOffer);
  const inbound = mapSerpApiOfferToJourney(returnOffer);

  return {
    id: createItineraryId([
      "round-trip",
      outbound.segments.map((segment) => segment.from + segment.to).join("-"),
      inbound.segments.map((segment) => segment.from + segment.to).join("-"),
      String(returnOffer.price),
      outbound.departureTime,
      inbound.departureTime,
    ]),
    price: returnOffer.price,
    currency: REQUESTED_CURRENCY,
    totalDurationMinutes: outbound.durationMinutes + inbound.durationMinutes,
    stopCount: countStops(outbound) + countStops(inbound),
    outbound,
    inbound,
    dealReference: returnOffer.booking_token ?? outboundOffer.booking_token ?? null,
  };
}

export function collectFlightOffers(
  response: { best_flights?: SerpApiFlightOffer[]; other_flights?: SerpApiFlightOffer[] },
): SerpApiFlightOffer[] {
  return [...(response.best_flights ?? []), ...(response.other_flights ?? [])];
}
