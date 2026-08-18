import { MAX_ROUND_TRIP_OUTBOUND_CANDIDATES } from "@/lib/provider/constants";
import type {
  ProviderItinerary,
  ProviderSearchParams,
  ProviderSearchResult,
} from "@/lib/provider/types";
import { fetchGoogleFlights } from "@/lib/provider/serpapi/client";
import {
  collectFlightOffers,
  mapOneWayItinerary,
  mapRoundTripItinerary,
} from "@/lib/provider/serpapi/map-offer";
import {
  buildOneWayQueryParams,
  buildRoundTripOutboundQueryParams,
  buildRoundTripReturnQueryParams,
} from "@/lib/provider/serpapi/params";

async function searchOneWay(
  params: ProviderSearchParams,
): Promise<ProviderItinerary[]> {
  const response = await fetchGoogleFlights(buildOneWayQueryParams(params));

  return collectFlightOffers(response).map(mapOneWayItinerary);
}

async function searchRoundTrip(
  params: ProviderSearchParams,
): Promise<ProviderItinerary[]> {
  const outboundResponse = await fetchGoogleFlights(
    buildRoundTripOutboundQueryParams(params),
  );

  const outboundCandidates = collectFlightOffers(outboundResponse).slice(
    0,
    MAX_ROUND_TRIP_OUTBOUND_CANDIDATES,
  );

  const itineraries: ProviderItinerary[] = [];

  for (const outboundOffer of outboundCandidates) {
    if (!outboundOffer.departure_token) {
      continue;
    }

    const returnResponse = await fetchGoogleFlights(
      buildRoundTripReturnQueryParams(params, outboundOffer.departure_token),
    );

    for (const returnOffer of collectFlightOffers(returnResponse)) {
      itineraries.push(mapRoundTripItinerary(outboundOffer, returnOffer));
    }
  }

  return itineraries;
}

export async function searchGoogleFlights(
  params: ProviderSearchParams,
): Promise<ProviderSearchResult> {
  const itineraries = params.returnDate
    ? await searchRoundTrip(params)
    : await searchOneWay(params);

  return {
    currency: "EUR",
    itineraries,
  };
}
