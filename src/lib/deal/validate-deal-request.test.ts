import { describe, expect, it } from "vitest";

import { validateDealRequest } from "@/lib/deal/validate-deal-request";

describe("validateDealRequest", () => {
  it("accepts a valid opaque dealReference", () => {
    expect(
      validateDealRequest({
        dealReference: "WyJDalJJTVUxUmFYaGFabWR0ZEhkQlJGUXpTM2RDUnk=",
      }),
    ).toEqual({
      dealReference: "WyJDalJJTVUxUmFYaGFabWR0ZEhkQlJGUXpTM2RDUnk=",
    });
  });

  it("rejects missing dealReference values", () => {
    expect(() => validateDealRequest({})).toThrow("dealReference is required.");
  });
});
