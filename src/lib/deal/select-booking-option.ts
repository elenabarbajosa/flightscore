import { DealResolutionError } from "@/lib/deal/errors";
import type { ProviderBookingOption } from "@/lib/provider/types";

function getEffectiveEurPrice(option: ProviderBookingOption): number | null {
  if (option.priceEur !== null && Number.isFinite(option.priceEur)) {
    return option.priceEur;
  }

  return null;
}

function compareCandidates(
  left: ProviderBookingOption,
  right: ProviderBookingOption,
): number {
  const leftPrice = getEffectiveEurPrice(left);
  const rightPrice = getEffectiveEurPrice(right);

  if (leftPrice === null && rightPrice === null) {
    return left.sellerName.localeCompare(right.sellerName);
  }

  if (leftPrice === null) {
    return 1;
  }

  if (rightPrice === null) {
    return -1;
  }

  if (leftPrice !== rightPrice) {
    return leftPrice - rightPrice;
  }

  if (left.isAirlineDirect !== right.isAirlineDirect) {
    return left.isAirlineDirect ? -1 : 1;
  }

  return left.sellerName.localeCompare(right.sellerName);
}

export function selectBookingOption(
  options: ProviderBookingOption[],
): ProviderBookingOption {
  const candidates = options.filter((option) => option.bookingRequest !== null);

  if (candidates.length === 0) {
    throw new DealResolutionError(
      "DEAL_UNAVAILABLE",
      "No resolvable booking options are available.",
    );
  }

  const ranked = [...candidates].sort(compareCandidates);

  return ranked[0];
}

export { getEffectiveEurPrice };
