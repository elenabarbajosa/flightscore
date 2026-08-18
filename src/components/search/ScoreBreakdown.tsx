import type { ScoringBreakdown } from "@/lib/types/scoring";
import {
  formatFactor,
  formatPercentContribution,
  formatScore,
} from "@/lib/client/format";

interface ScoreBreakdownProps {
  breakdown: ScoringBreakdown;
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const hasPenalties =
    breakdown.riskyConnectionCount > 0 ||
    breakdown.longLayoverCount > 0 ||
    breakdown.airportChangeCount > 0;

  return (
    <details className="group mt-1">
      <summary className="cursor-pointer select-none text-[11px] font-medium text-neutral-500 transition hover:text-neutral-800">
        Why this score?
      </summary>
      <div className="mt-2 rounded-lg border border-neutral-100 bg-neutral-50/80 p-3">
        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <dt className="font-medium text-neutral-700">FlightScore</dt>
            <dd className="font-semibold tabular-nums text-neutral-900">
              {formatScore(breakdown.finalScore)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-neutral-600">Price</dt>
            <dd className="tabular-nums text-neutral-800">
              {formatPercentContribution(breakdown.priceContribution)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-neutral-600">Stops</dt>
            <dd className="tabular-nums text-neutral-800">
              {formatPercentContribution(breakdown.stopsContribution)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-neutral-600">Duration</dt>
            <dd className="tabular-nums text-neutral-800">
              {formatPercentContribution(breakdown.durationContribution)}
            </dd>
          </div>
          {hasPenalties ? (
            <>
              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <dt className="font-medium text-neutral-700">
                  Connection penalties
                </dt>
                <dd className="tabular-nums text-neutral-800">
                  ×{formatFactor(breakdown.totalPenaltyFactor)}
                </dd>
              </div>
              {breakdown.riskyConnectionCount > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-neutral-600">Tight connections</dt>
                  <dd className="tabular-nums text-neutral-800">
                    {breakdown.riskyConnectionCount}
                  </dd>
                </div>
              ) : null}
              {breakdown.longLayoverCount > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-neutral-600">Long layovers</dt>
                  <dd className="tabular-nums text-neutral-800">
                    {breakdown.longLayoverCount}
                  </dd>
                </div>
              ) : null}
              {breakdown.airportChangeCount > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-neutral-600">Airport changes</dt>
                  <dd className="tabular-nums text-neutral-800">
                    {breakdown.airportChangeCount}
                  </dd>
                </div>
              ) : null}
            </>
          ) : null}
        </dl>
      </div>
    </details>
  );
}
