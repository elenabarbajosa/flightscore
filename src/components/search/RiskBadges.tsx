import type { Itinerary } from "@/lib/types/search";
import { isLayoverRisky, isLongLayover } from "@/lib/scoring";

interface RiskBadgesProps {
  itinerary: Itinerary;
}

function collectLayovers(itinerary: Itinerary) {
  const layovers = [...itinerary.outbound.layovers];

  if (itinerary.inbound) {
    layovers.push(...itinerary.inbound.layovers);
  }

  return layovers;
}

export function RiskBadges({ itinerary }: RiskBadgesProps) {
  const layovers = collectLayovers(itinerary);
  const hasTightConnection = layovers.some(isLayoverRisky);
  const hasLongLayover = layovers.some(isLongLayover);
  const hasAirportChange = layovers.some((layover) => layover.airportChange);

  if (!hasTightConnection && !hasLongLayover && !hasAirportChange) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {hasTightConnection ? (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200/80">
          Tight connection
        </span>
      ) : null}
      {hasLongLayover ? (
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700 ring-1 ring-neutral-200">
          Long layover
        </span>
      ) : null}
      {hasAirportChange ? (
        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-800 ring-1 ring-rose-200/80">
          Airport change
        </span>
      ) : null}
    </div>
  );
}
