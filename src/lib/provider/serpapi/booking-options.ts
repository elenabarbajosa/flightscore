import { ProviderError } from "@/lib/provider/errors";
import type { ProviderDealSearchContext } from "@/lib/provider/types";
import { fetchGoogleFlights } from "@/lib/provider/serpapi/client";
import { buildBookingOptionsQueryParams } from "@/lib/provider/serpapi/booking-params";
import { mapSerpApiBookingOptions } from "@/lib/provider/serpapi/map-booking-options";
import type { ProviderDealResolutionResult } from "@/lib/provider/types";

function mapDealLookupFailure(error: string): ProviderError {
  if (/quota/i.test(error)) {
    return new ProviderError(
      "PROVIDER_QUOTA_EXCEEDED",
      "SerpApi quota exceeded",
    );
  }

  if (/expired|invalid|not found|no longer/i.test(error)) {
    return new ProviderError(
      "PROVIDER_DEAL_EXPIRED",
      "Booking token is no longer valid",
    );
  }

  return new ProviderError(
    "PROVIDER_REQUEST_FAILED",
    "SerpApi returned an error response",
  );
}

export async function fetchBookingOptions(
  dealReference: string,
  searchContext: ProviderDealSearchContext,
): Promise<ProviderDealResolutionResult> {
  const response = await fetchGoogleFlights(
    buildBookingOptionsQueryParams(dealReference, searchContext),
  );

  if (response.error) {
    throw mapDealLookupFailure(response.error);
  }

  const rawEntries = response.booking_options ?? [];
  const options = mapSerpApiBookingOptions(rawEntries);

  if (options.length === 0) {
    if (
      rawEntries.length > 0 &&
      rawEntries.every((entry) => entry.separate_tickets === true)
    ) {
      throw new ProviderError(
        "PROVIDER_NO_BOOKING_OPTIONS",
        "Separate ticket booking options only",
      );
    }

    throw new ProviderError(
      "PROVIDER_NO_BOOKING_OPTIONS",
      "No booking options returned",
    );
  }

  return { options };
}
