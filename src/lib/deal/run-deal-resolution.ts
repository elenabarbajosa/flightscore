import { getDealCache, type DealCache } from "@/lib/deal/cache";
import {
  getDealContextCache,
  type DealContextCache,
} from "@/lib/deal/context-cache";
import { DealResolutionError } from "@/lib/deal/errors";
import { resolveDealSearchContext } from "@/lib/deal/parse-deal-reference";
import { selectBookingOption } from "@/lib/deal/select-booking-option";
import { UnsafeUrlError } from "@/lib/deal/validate-external-url";
import { getFlightProvider } from "@/lib/provider";
import { ProviderError } from "@/lib/provider/errors";
import type { FlightProvider } from "@/lib/provider/types";
import type { DealRequest, DealResponse } from "@/lib/types/deal";

export interface RunDealResolutionDependencies {
  provider?: FlightProvider;
  cache?: DealCache;
  contextCache?: DealContextCache;
}

export async function runDealResolution(
  request: DealRequest,
  dependencies: RunDealResolutionDependencies = {},
): Promise<DealResponse> {
  const provider = dependencies.provider ?? getFlightProvider();
  const cache = dependencies.cache ?? getDealCache();
  const contextCache = dependencies.contextCache ?? getDealContextCache();

  const cached = await cache.get(request.dealReference);

  if (cached) {
    return cached;
  }

  try {
    const searchContext = await resolveDealSearchContext(
      request.dealReference,
      contextCache,
    );

    if (!searchContext) {
      throw new DealResolutionError(
        "DEAL_UNAVAILABLE",
        "Search context for this offer is no longer available.",
      );
    }

    const providerResult = await provider.resolveDeal({
      dealReference: request.dealReference,
      searchContext,
    });

    const selectedOption = selectBookingOption(providerResult.options);
    const resolved = await provider.resolveBookingDestination(selectedOption);

    const response: DealResponse = {
      redirectUrl: resolved.redirectUrl,
      sellerName: resolved.sellerName,
    };

    await cache.set(request.dealReference, response);

    return response;
  } catch (error) {
    if (error instanceof DealResolutionError) {
      throw error;
    }

    if (error instanceof UnsafeUrlError) {
      throw new DealResolutionError(
        "DEAL_UNAVAILABLE",
        "Booking destination could not be validated.",
      );
    }

    if (error instanceof ProviderError) {
      if (error.code === "PROVIDER_DEAL_EXPIRED") {
        throw new DealResolutionError(
          "DEAL_EXPIRED",
          "This offer has expired.",
        );
      }

      if (error.code === "PROVIDER_NO_BOOKING_OPTIONS") {
        throw new DealResolutionError(
          "DEAL_UNAVAILABLE",
          "Separate bookings are not supported yet for this itinerary.",
        );
      }

      throw error;
    }

    throw error;
  }
}

export function mapProviderErrorToDealHttpStatus(error: ProviderError): number {
  switch (error.code) {
    case "PROVIDER_QUOTA_EXCEEDED":
      return 429;
    case "PROVIDER_TIMEOUT":
      return 504;
    default:
      return 502;
  }
}

export function mapDealResolutionErrorToHttpStatus(
  error: DealResolutionError,
): number {
  switch (error.code) {
    case "DEAL_EXPIRED":
      return 410;
    default:
      return 404;
  }
}
