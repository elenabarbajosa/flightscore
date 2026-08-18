"use client";

import { useCallback, useRef, useState } from "react";

import { resolveDeal, DealApiError } from "@/lib/client/deal-api";
import { PendingActionGuard } from "@/lib/client/pending-action-guard";

interface ViewDealButtonProps {
  dealReference: string;
}

export function ViewDealButton({ dealReference }: ViewDealButtonProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pendingActionRef = useRef(new PendingActionGuard());

  const handleClick = useCallback(async () => {
    setErrorMessage(null);

    const task = pendingActionRef.current.run(async () => {
      setIsResolving(true);

      try {
        const result = await resolveDeal({ dealReference });
        window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        const message =
          error instanceof DealApiError
            ? error.message
            : "Something went wrong. Please try again.";

        setErrorMessage(message);
      } finally {
        setIsResolving(false);
      }
    });

    if (!task) {
      return;
    }

    await task;
  }, [dealReference]);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={isResolving}
        onClick={() => {
          void handleClick();
        }}
        className="inline-flex h-8 items-center justify-center rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isResolving ? "Opening deal…" : "View deal"}
      </button>
      {errorMessage ? (
        <p className="text-[11px] text-rose-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
