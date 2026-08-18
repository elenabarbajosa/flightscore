import {
  PROVIDER_REQUEST_TIMEOUT_MS,
  SERPAPI_BASE_URL,
} from "@/lib/provider/constants";
import { ProviderError } from "@/lib/provider/errors";
import type {
  SerpApiGoogleFlightsResponse,
  SerpApiQueryParams,
} from "@/lib/provider/serpapi/types";

function buildSearchUrl(params: SerpApiQueryParams): string {
  const url = new URL(SERPAPI_BASE_URL);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function mapHttpFailure(status: number): ProviderError {
  if (status === 429) {
    return new ProviderError(
      "PROVIDER_QUOTA_EXCEEDED",
      "SerpApi quota exceeded",
    );
  }

  return new ProviderError(
    "PROVIDER_REQUEST_FAILED",
    `SerpApi request failed with status ${status}`,
  );
}

export async function fetchGoogleFlights(
  params: SerpApiQueryParams,
): Promise<SerpApiGoogleFlightsResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    PROVIDER_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(buildSearchUrl(params), {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw mapHttpFailure(response.status);
    }

    const payload = (await response.json()) as SerpApiGoogleFlightsResponse;

    if (payload.error) {
      if (/quota/i.test(payload.error)) {
        throw new ProviderError(
          "PROVIDER_QUOTA_EXCEEDED",
          "SerpApi quota exceeded",
        );
      }

      throw new ProviderError(
        "PROVIDER_REQUEST_FAILED",
        "SerpApi returned an error response",
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError("PROVIDER_TIMEOUT", "SerpApi request timed out");
    }

    throw new ProviderError(
      "PROVIDER_REQUEST_FAILED",
      "SerpApi request failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}
