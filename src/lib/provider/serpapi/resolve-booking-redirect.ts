import { ProviderError } from "@/lib/provider/errors";
import {
  assertGoogleBookingRequestUrl,
  assertSafeExternalHttpsUrl,
  isGoogleBookingRequestUrl,
} from "@/lib/deal/validate-external-url";
import type {
  ProviderBookingOption,
  ProviderResolvedDestination,
} from "@/lib/provider/types";

const MAX_REDIRECTS = 10;
const REDIRECT_TIMEOUT_MS = 10_000;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMetaRefreshUrl(html: string): string | null {
  const patterns = [
    /content=["']\s*0;\s*url=['"]?\s*([^"'>\s]+)/i,
    /http-equiv=["']refresh["'][^>]*content=["'][^"']*url=['"]?\s*([^"'>\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  return null;
}

function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function isAcceptableFinalStatus(status: number): boolean {
  if (status >= 200 && status < 300) {
    return true;
  }

  // Some OTAs return 403 to non-browser clients while still exposing a valid landing URL.
  if (status === 403) {
    return true;
  }

  return false;
}

function resolveLocationUrl(currentUrl: URL, location: string): string {
  return new URL(location, currentUrl).toString();
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REDIRECT_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError("PROVIDER_TIMEOUT", "Booking redirect timed out");
    }

    throw new ProviderError(
      "PROVIDER_REQUEST_FAILED",
      "Booking redirect request failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveBookingDestination(
  option: ProviderBookingOption,
): Promise<ProviderResolvedDestination> {
  const bookingRequest = option.bookingRequest;

  if (!bookingRequest) {
    throw new ProviderError(
      "PROVIDER_NO_BOOKING_OPTIONS",
      "Booking request is missing",
    );
  }

  let currentUrl = bookingRequest.url;

  if (bookingRequest.method === "POST") {
    await assertGoogleBookingRequestUrl(currentUrl);
  } else {
    await assertGoogleBookingRequestUrl(currentUrl);
  }

  let method: "GET" | "POST" = bookingRequest.method;
  let postBody = bookingRequest.postBody;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const validatedCurrentUrl = await assertSafeExternalHttpsUrl(currentUrl);
    const response = await fetchWithTimeout(validatedCurrentUrl.toString(), {
      method,
      ...(method === "POST" && postBody
        ? {
            body: postBody,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        : {}),
    });

    if (isRedirectStatus(response.status)) {
      const location = response.headers.get("location");

      if (!location) {
        throw new ProviderError(
          "PROVIDER_REQUEST_FAILED",
          "Redirect response missing location",
        );
      }

      currentUrl = resolveLocationUrl(validatedCurrentUrl, location);
      await assertSafeExternalHttpsUrl(currentUrl);
      method = response.status === 307 || response.status === 308 ? method : "GET";
      postBody = undefined;
      continue;
    }

    if (isAcceptableFinalStatus(response.status)) {
      const responseUrl = new URL(response.url || validatedCurrentUrl.toString());

      if (isGoogleBookingRequestUrl(responseUrl)) {
        const html = await response.text();
        const metaRefreshTarget = extractMetaRefreshUrl(html);

        if (metaRefreshTarget) {
          currentUrl = resolveLocationUrl(responseUrl, metaRefreshTarget);
          await assertSafeExternalHttpsUrl(currentUrl);
          method = "GET";
          postBody = undefined;
          continue;
        }

        throw new ProviderError(
          "PROVIDER_REQUEST_FAILED",
          "Booking redirect ended on Google tracker",
        );
      }

      await assertSafeExternalHttpsUrl(responseUrl.toString());

      return {
        redirectUrl: responseUrl.toString(),
        sellerName: option.sellerName,
      };
    }

    throw new ProviderError(
      "PROVIDER_REQUEST_FAILED",
      "Booking redirect returned an unexpected status",
    );
  }

  throw new ProviderError(
    "PROVIDER_REQUEST_FAILED",
    "Booking redirect exceeded hop limit",
  );
}
