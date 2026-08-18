import type { SearchRequest, SearchResponse } from "@/lib/types/search";
import type { SearchErrorResponse } from "@/lib/types/search";

import { getSearchErrorMessage } from "@/lib/client/search-errors";

export class SearchApiError extends Error {
  readonly code: SearchErrorResponse["error"];
  readonly field?: string;

  constructor(payload: SearchErrorResponse) {
    super(getSearchErrorMessage(payload));
    this.name = "SearchApiError";
    this.code = payload.error;
    this.field = payload.field;
  }
}

export async function searchFlights(request: SearchRequest): Promise<SearchResponse> {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as SearchResponse | SearchErrorResponse;

  if (!response.ok) {
    throw new SearchApiError(payload as SearchErrorResponse);
  }

  return payload as SearchResponse;
}
