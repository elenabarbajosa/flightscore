import type { FlightProvider } from "@/lib/provider/types";
import { createSerpApiFlightProvider } from "@/lib/provider/serpapi";

export type {
  FlightProvider,
  ProviderBookingOption,
  ProviderBookingRequest,
  ProviderDealResolutionRequest,
  ProviderDealResolutionResult,
  ProviderItinerary,
  ProviderJourney,
  ProviderLayoverHint,
  ProviderResolvedDestination,
  ProviderSearchParams,
  ProviderSearchResult,
  ProviderSegment,
} from "@/lib/provider/types";

export { ProviderError } from "@/lib/provider/errors";
export type { ProviderErrorCode } from "@/lib/provider/errors";

export function getFlightProvider(): FlightProvider {
  return createSerpApiFlightProvider();
}
