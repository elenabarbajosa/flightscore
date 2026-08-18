import {
  REQUESTED_CURRENCY,
  REQUESTED_LANGUAGE,
} from "@/lib/provider/constants";
import type { ProviderDealSearchContext } from "@/lib/provider/types";
import { getSerpApiApiKey, getSerpApiEngine } from "@/lib/provider/serpapi/params";
import type { SerpApiQueryParams } from "@/lib/provider/serpapi/types";

export function buildBookingOptionsQueryParams(
  bookingToken: string,
  context: ProviderDealSearchContext,
): SerpApiQueryParams {
  const params: SerpApiQueryParams = {
    engine: getSerpApiEngine(),
    api_key: getSerpApiApiKey(),
    output: "json",
    departure_id: context.origin.trim().toUpperCase(),
    arrival_id: context.destination.trim().toUpperCase(),
    outbound_date: context.departureDate,
    booking_token: bookingToken,
    currency: REQUESTED_CURRENCY,
    hl: REQUESTED_LANGUAGE,
    type: context.returnDate ? "1" : "2",
  };

  if (context.returnDate) {
    params.return_date = context.returnDate;
  }

  return params;
}
