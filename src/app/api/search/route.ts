import { NextResponse } from "next/server";

import { ProviderError } from "@/lib/provider/errors";
import { SearchValidationError } from "@/lib/search/errors";
import {
  mapProviderErrorToHttpStatus,
  runSearch,
} from "@/lib/search/run-search";
import { validateSearchRequest } from "@/lib/search/validate-search-request";
import type { SearchErrorResponse } from "@/lib/types/search";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<SearchErrorResponse>(
      { error: "INVALID_INPUT" },
      { status: 400 },
    );
  }

  try {
    const searchRequest = validateSearchRequest(body);
    const response = await runSearch(searchRequest);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof SearchValidationError) {
      return NextResponse.json<SearchErrorResponse>(
        {
          error: "INVALID_INPUT",
          ...(error.field ? { field: error.field } : {}),
        },
        { status: 400 },
      );
    }

    if (error instanceof ProviderError) {
      const status = mapProviderErrorToHttpStatus(error);
      const errorCode =
        status === 429
          ? "QUOTA_EXCEEDED"
          : status === 504
            ? "TIMEOUT"
            : "PROVIDER_ERROR";

      return NextResponse.json<SearchErrorResponse>(
        { error: errorCode },
        { status },
      );
    }

    return NextResponse.json<SearchErrorResponse>(
      { error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
