import type { SearchErrorResponse } from "@/lib/types/search";

const SEARCH_ERROR_MESSAGES: Record<SearchErrorResponse["error"], string> = {
  INVALID_INPUT: "Please check your search details and try again.",
  QUOTA_EXCEEDED: "Search limit reached. Please wait a few minutes and try again.",
  PROVIDER_ERROR: "Flight search is temporarily unavailable. Please try again shortly.",
  TIMEOUT: "The search took too long. Please try again.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};

function formatFieldLabel(field: string): string {
  switch (field) {
    case "departureDate":
      return "departure date";
    case "returnDate":
      return "return date";
    case "cabinClass":
      return "cabin class";
    default:
      return field;
  }
}

export function getSearchErrorMessage(error: SearchErrorResponse): string {
  const baseMessage = SEARCH_ERROR_MESSAGES[error.error];

  if (error.error === "INVALID_INPUT" && error.field) {
    return `${baseMessage} (${formatFieldLabel(error.field)})`;
  }

  return baseMessage;
}
