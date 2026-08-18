import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveDeal, DealApiError } from "@/lib/client/deal-api";

describe("deal API wrapper", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns redirectUrl and sellerName on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          redirectUrl: "https://airline.example/book",
          sellerName: "Example Air",
        }),
      }),
    );

    const response = await resolveDeal({ dealReference: "token-123" });

    expect(response.redirectUrl).toBe("https://airline.example/book");
    expect(JSON.stringify(response)).not.toContain("post_data");
  });

  it("throws DealApiError with safe user-facing copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "DEAL_UNAVAILABLE" }),
      }),
    );

    await expect(resolveDeal({ dealReference: "token-123" })).rejects.toMatchObject(
      {
        name: "DealApiError",
        code: "DEAL_UNAVAILABLE",
      },
    );

    try {
      await resolveDeal({ dealReference: "token-123" });
    } catch (error) {
      expect(error).toBeInstanceOf(DealApiError);
      expect((error as DealApiError).message).not.toContain("SerpApi");
    }
  });
});
