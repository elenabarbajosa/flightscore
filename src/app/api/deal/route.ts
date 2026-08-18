import { NextResponse } from "next/server";

import {
  DealResolutionError,
  DealValidationError,
} from "@/lib/deal/errors";
import {
  mapDealResolutionErrorToHttpStatus,
  mapProviderErrorToDealHttpStatus,
  runDealResolution,
} from "@/lib/deal/run-deal-resolution";
import { validateDealRequest } from "@/lib/deal/validate-deal-request";
import { ProviderError } from "@/lib/provider/errors";
import type { DealErrorResponse } from "@/lib/types/deal";

const DEAL_UNAVAILABLE_MESSAGE =
  "Booking is unavailable for this flight right now.";
const DEAL_EXPIRED_MESSAGE =
  "This offer has expired. Search again for current prices.";
const QUOTA_MESSAGE =
  "Booking lookup limit reached. Please wait a few minutes and try again.";
const TIMEOUT_MESSAGE =
  "Opening the booking page took too long. Please try again.";
const PROVIDER_MESSAGE =
  "Booking lookup is temporarily unavailable. Please try again shortly.";
const INTERNAL_MESSAGE = "Something went wrong. Please try again.";

function getPublicDealErrorMessage(code: DealErrorResponse["error"]): string {
  switch (code) {
    case "INVALID_INPUT":
      return "Please check your booking request and try again.";
    case "DEAL_UNAVAILABLE":
      return DEAL_UNAVAILABLE_MESSAGE;
    case "DEAL_EXPIRED":
      return DEAL_EXPIRED_MESSAGE;
    case "QUOTA_EXCEEDED":
      return QUOTA_MESSAGE;
    case "TIMEOUT":
      return TIMEOUT_MESSAGE;
    case "PROVIDER_ERROR":
      return PROVIDER_MESSAGE;
    default:
      return INTERNAL_MESSAGE;
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<DealErrorResponse>(
      { error: "INVALID_INPUT" },
      { status: 400 },
    );
  }

  try {
    const dealRequest = validateDealRequest(body);
    const response = await runDealResolution(dealRequest);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof DealValidationError) {
      return NextResponse.json<DealErrorResponse>(
        {
          error: "INVALID_INPUT",
          ...(error.field ? { field: error.field } : {}),
        },
        { status: 400 },
      );
    }

    if (error instanceof DealResolutionError) {
      const status = mapDealResolutionErrorToHttpStatus(error);

      return NextResponse.json<DealErrorResponse>(
        {
          error: error.code,
        },
        { status },
      );
    }

    if (error instanceof ProviderError) {
      const status = mapProviderErrorToDealHttpStatus(error);

      const errorCode =
        status === 429
          ? "QUOTA_EXCEEDED"
          : status === 504
            ? "TIMEOUT"
            : "PROVIDER_ERROR";

      return NextResponse.json<DealErrorResponse>(
        { error: errorCode },
        { status },
      );
    }

    return NextResponse.json<DealErrorResponse>(
      { error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export { getPublicDealErrorMessage };
