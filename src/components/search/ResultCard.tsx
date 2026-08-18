import type { ScoredItinerary } from "@/lib/types/scoring";
import type { Journey } from "@/lib/types/search";
import {
  formatDuration,
  formatPriceEUR,
  formatScore,
  formatShortDate,
  formatTime,
  getPrimaryCarrier,
  summarizeLayovers,
} from "@/lib/client/format";

import { RiskBadges } from "@/components/search/RiskBadges";
import { RouteVisualization } from "@/components/search/RouteVisualization";
import { ScoreBreakdown } from "@/components/search/ScoreBreakdown";

interface ResultCardProps {
  rank: number;
  result: ScoredItinerary;
}

function getCarrierLabel(result: ScoredItinerary): string {
  const segment = result.itinerary.outbound.segments[0];

  if (!segment) {
    return "—";
  }

  return getPrimaryCarrier(
    segment.operatingCarrier,
    segment.marketingCarrier,
  );
}

function getStopLabel(layoverCount: number): string {
  if (layoverCount === 0) {
    return "Direct";
  }

  return `${layoverCount} stop${layoverCount === 1 ? "" : "s"}`;
}

function JourneyBlock({
  journey,
  label,
  compact = false,
}: {
  journey: Journey;
  label: string;
  compact?: boolean;
}) {
  const firstSegment = journey.segments[0];
  const lastSegment = journey.segments[journey.segments.length - 1];

  if (!firstSegment || !lastSegment) {
    return null;
  }

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-500">
        {label}
      </p>

      <div className={`grid gap-3 ${compact ? "sm:grid-cols-[minmax(0,1fr)_auto]" : "lg:grid-cols-[minmax(0,1fr)_auto]"}`}>
        <div className="min-w-0 space-y-2">
          <RouteVisualization segments={journey.segments} />

          <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
            <div>
              <p className="text-base font-semibold tabular-nums text-neutral-900">
                {formatTime(firstSegment.departureTime)}
              </p>
              <p className="text-xs font-semibold text-neutral-800">
                {firstSegment.from}
              </p>
              <p className="text-[11px] text-neutral-500">
                {formatShortDate(firstSegment.departureTime)}
              </p>
            </div>

            <div className="hidden pb-1 text-neutral-300 sm:block" aria-hidden="true">
              →
            </div>

            <div>
              <p className="text-base font-semibold tabular-nums text-neutral-900">
                {formatTime(lastSegment.arrivalTime)}
              </p>
              <p className="text-xs font-semibold text-neutral-800">
                {lastSegment.to}
              </p>
              <p className="text-[11px] text-neutral-500">
                {formatShortDate(lastSegment.arrivalTime)}
              </p>
            </div>
          </div>

          {journey.layovers.length > 0 ? (
            <p className="text-[11px] text-neutral-500">
              {summarizeLayovers(journey.layovers)}
            </p>
          ) : null}
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-medium text-neutral-800">
            {formatDuration(journey.durationMinutes)}
          </p>
          <p className="text-[11px] text-neutral-500">
            {getStopLabel(journey.layovers.length)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ResultCard({ rank, result }: ResultCardProps) {
  const { itinerary, score } = result;

  return (
    <article className="fs-panel overflow-hidden">
      <div className="grid gap-3 p-3.5 lg:grid-cols-[4.5rem_minmax(0,1fr)_7.5rem] lg:items-start lg:gap-4 lg:p-4">
        <div className="flex items-start gap-2 lg:flex-col lg:items-center lg:gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-700">
            {rank}
          </span>
          <div className="fs-score-badge lg:flex-col lg:items-center lg:px-2 lg:py-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-accent-muted">
              Score
            </span>
            <span className="text-sm leading-none">
              {formatScore(score.finalScore)}
            </span>
          </div>
        </div>

        <div className="min-w-0 space-y-3 border-t border-neutral-100 pt-3 lg:border-t-0 lg:pt-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-neutral-900">
              {getCarrierLabel(result)}
            </p>
            <span className="text-[11px] text-neutral-400">·</span>
            <p className="text-[11px] text-neutral-500">
              {formatDuration(itinerary.totalDurationMinutes)} total
              <span className="mx-1 text-neutral-300">·</span>
              {itinerary.stopCount} stop{itinerary.stopCount === 1 ? "" : "s"}
            </p>
          </div>

          <JourneyBlock journey={itinerary.outbound} label="Outbound" />

          {itinerary.inbound ? (
            <div className="border-t border-neutral-100 pt-3">
              <JourneyBlock
                journey={itinerary.inbound}
                label="Return"
                compact
              />
            </div>
          ) : null}

          <RiskBadges itinerary={itinerary} />
          <ScoreBreakdown breakdown={score} />
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 pt-3 lg:flex-col lg:items-end lg:justify-start lg:border-t-0 lg:pt-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500 lg:hidden">
            Price
          </p>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 lg:text-right">
            {formatPriceEUR(itinerary.price)}
          </p>
        </div>
      </div>
    </article>
  );
}
