import { DealValidationError } from "@/lib/deal/errors";
import type { DealRequest } from "@/lib/types/deal";

const MAX_DEAL_REFERENCE_LENGTH = 8192;
const DEAL_REFERENCE_PATTERN = /^[\w+/=-]+$/;

export function validateDealRequest(body: unknown): DealRequest {
  if (!body || typeof body !== "object") {
    throw new DealValidationError("Request body must be a JSON object.");
  }

  const dealReference = (body as { dealReference?: unknown }).dealReference;

  if (typeof dealReference !== "string") {
    throw new DealValidationError(
      "dealReference is required.",
      "dealReference",
    );
  }

  const trimmed = dealReference.trim();

  if (!trimmed) {
    throw new DealValidationError(
      "dealReference is required.",
      "dealReference",
    );
  }

  if (trimmed.length > MAX_DEAL_REFERENCE_LENGTH) {
    throw new DealValidationError(
      "dealReference is too long.",
      "dealReference",
    );
  }

  if (!DEAL_REFERENCE_PATTERN.test(trimmed)) {
    throw new DealValidationError(
      "dealReference has an invalid format.",
      "dealReference",
    );
  }

  return { dealReference: trimmed };
}
