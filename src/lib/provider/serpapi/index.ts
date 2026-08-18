import { ProviderError } from "@/lib/provider/errors";
import type {
  FlightProvider,
  ProviderBookingOption,
  ProviderDealResolutionRequest,
  ProviderDealResolutionResult,
  ProviderResolvedDestination,
  ProviderSearchParams,
  ProviderSearchResult,
} from "@/lib/provider/types";
import { fetchBookingOptions } from "@/lib/provider/serpapi/booking-options";
import { resolveBookingDestination } from "@/lib/provider/serpapi/resolve-booking-redirect";
import { searchGoogleFlights } from "@/lib/provider/serpapi/search";

export class SerpApiFlightProvider implements FlightProvider {
  async search(params: ProviderSearchParams): Promise<ProviderSearchResult> {
    try {
      return await searchGoogleFlights(params);
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      if (
        error instanceof Error &&
        error.message.startsWith("Missing required environment variable")
      ) {
        throw new ProviderError("PROVIDER_CONFIG_ERROR", error.message);
      }

      throw error;
    }
  }

  async resolveDeal(
    request: ProviderDealResolutionRequest,
  ): Promise<ProviderDealResolutionResult> {
    try {
      return await fetchBookingOptions(
        request.dealReference,
        request.searchContext,
      );
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      throw new ProviderError(
        "PROVIDER_REQUEST_FAILED",
        "Booking options lookup failed",
      );
    }
  }

  async resolveBookingDestination(
    option: ProviderBookingOption,
  ): Promise<ProviderResolvedDestination> {
    try {
      return await resolveBookingDestination(option);
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      throw new ProviderError(
        "PROVIDER_REQUEST_FAILED",
        "Booking destination resolution failed",
      );
    }
  }
}

export function createSerpApiFlightProvider(): SerpApiFlightProvider {
  return new SerpApiFlightProvider();
}
