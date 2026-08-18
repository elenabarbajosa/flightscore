import type { DealRequest, DealResponse } from "@/lib/types/deal";
import type { DealErrorResponse } from "@/lib/types/deal";

import { getDealErrorMessage } from "@/lib/client/deal-errors";

export class DealApiError extends Error {
  readonly code: DealErrorResponse["error"];
  readonly field?: string;

  constructor(payload: DealErrorResponse) {
    super(getDealErrorMessage(payload.error));
    this.name = "DealApiError";
    this.code = payload.error;
    this.field = payload.field;
  }
}

export async function resolveDeal(request: DealRequest): Promise<DealResponse> {
  const response = await fetch("/api/deal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as DealResponse | DealErrorResponse;

  if (!response.ok) {
    throw new DealApiError(payload as DealErrorResponse);
  }

  return payload as DealResponse;
}
