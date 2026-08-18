const DEAL_ERROR_MESSAGES: Record<
  import("@/lib/types/deal").DealErrorCode,
  string
> = {
  INVALID_INPUT: "Please check your booking request and try again.",
  DEAL_UNAVAILABLE: "Booking is unavailable for this flight right now.",
  DEAL_EXPIRED: "This offer has expired. Search again for current prices.",
  QUOTA_EXCEEDED:
    "Booking lookup limit reached. Please wait a few minutes and try again.",
  TIMEOUT: "Opening the booking page took too long. Please try again.",
  PROVIDER_ERROR:
    "Booking lookup is temporarily unavailable. Please try again shortly.",
  RATE_LIMITED: "Too many requests. Please try again in a few minutes.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};

export function getDealErrorMessage(
  error: import("@/lib/types/deal").DealErrorCode,
): string {
  return DEAL_ERROR_MESSAGES[error];
}
