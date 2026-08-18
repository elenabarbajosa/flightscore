import { describe, expect, it, vi } from "vitest";

import { PendingActionGuard } from "@/lib/client/pending-action-guard";

describe("PendingActionGuard", () => {
  it("blocks duplicate clicks while a request is pending", async () => {
    const guard = new PendingActionGuard();
    const action = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve("done"), 20);
        }),
    );

    const first = guard.run(action);
    const second = guard.run(action);

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(action).toHaveBeenCalledTimes(1);

    await first;
  });
});
