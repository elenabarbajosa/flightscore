import type {
  ProviderBookingOption,
  ProviderBookingRequest,
} from "@/lib/provider/types";
import type {
  SerpApiBookingOptionBlock,
  SerpApiBookingOptionEntry,
} from "@/lib/provider/serpapi/types";

function getEurPrice(block: SerpApiBookingOptionBlock): number | null {
  const localEur = block.local_prices?.find(
    (entry) => entry.currency?.toUpperCase() === "EUR",
  );

  if (
    localEur &&
    typeof localEur.price === "number" &&
    Number.isFinite(localEur.price)
  ) {
    return localEur.price;
  }

  if (typeof block.price === "number" && Number.isFinite(block.price)) {
    return block.price;
  }

  return null;
}

function mapBookingRequest(
  block: SerpApiBookingOptionBlock,
): ProviderBookingRequest | null {
  const url = block.booking_request?.url?.trim();

  if (!url) {
    return null;
  }

  const postData = block.booking_request?.post_data;

  if (typeof postData === "string" && postData.length > 0) {
    return {
      method: "POST",
      url,
      postBody: postData,
    };
  }

  return {
    method: "GET",
    url,
  };
}

function mapBookingBlock(
  block: SerpApiBookingOptionBlock,
  isSeparateTickets: boolean,
): ProviderBookingOption | null {
  const sellerName = block.book_with?.trim();

  if (!sellerName) {
    return null;
  }

  return {
    sellerName,
    isAirlineDirect: block.airline === true,
    priceEur: getEurPrice(block),
    isSeparateTickets,
    bookingRequest: mapBookingRequest(block),
    bookingPhone: block.booking_phone,
  };
}

export function mapSerpApiBookingOptions(
  entries: SerpApiBookingOptionEntry[],
): ProviderBookingOption[] {
  const options: ProviderBookingOption[] = [];

  for (const entry of entries) {
    if (entry.separate_tickets === true) {
      continue;
    }

    if (entry.together) {
      const mapped = mapBookingBlock(entry.together, false);

      if (mapped) {
        options.push(mapped);
      }
    }
  }

  return options;
}
