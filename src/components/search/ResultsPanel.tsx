import type { ScoredItinerary } from "@/lib/types/scoring";
import type { SearchContext } from "@/lib/client/search-results";

import { ResultCard } from "@/components/search/ResultCard";
import { SearchErrorBanner } from "@/components/search/SearchErrorBanner";

interface ResultsPanelProps {
  searchContext: SearchContext | null;
  scoredResults: ScoredItinerary[];
  visibleCount: number;
  searchError: string | null;
  isSearching: boolean;
  hasSuccessfulSearch: boolean;
  onShowMore: () => void;
  showMoreAvailable: boolean;
}

function formatFlightCount(count: number): string {
  return `${count} flight option${count === 1 ? "" : "s"}`;
}

export function ResultsPanel({
  searchContext,
  scoredResults,
  visibleCount,
  searchError,
  isSearching,
  hasSuccessfulSearch,
  onShowMore,
  showMoreAvailable,
}: ResultsPanelProps) {
  const visibleResults = scoredResults.slice(0, visibleCount);

  return (
    <section className="min-w-0 space-y-3">
      {searchError ? <SearchErrorBanner message={searchError} /> : null}

      {searchContext ? (
        <div className="border-b border-neutral-200 pb-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
              {searchContext.origin}
              <span className="mx-2 font-normal text-neutral-400">→</span>
              {searchContext.destination}
            </h2>
            {searchContext.cached ? (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-500">
                Cached
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            {formatFlightCount(searchContext.resultCount)}
            <span className="mx-1.5 text-neutral-300">·</span>
            {searchContext.tripType}
          </p>
        </div>
      ) : null}

      {!hasSuccessfulSearch && !isSearching ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white/70 px-4 py-12 text-center">
          <p className="text-sm font-medium text-neutral-700">
            Search to compare flights
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Results update instantly when you adjust ranking preferences.
          </p>
        </div>
      ) : null}

      {hasSuccessfulSearch && visibleResults.length === 0 && !isSearching ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-600">
          No flights matched this search.
        </div>
      ) : null}

      {visibleResults.length > 0 ? (
        <div className="space-y-2.5">
          {visibleResults.map((result, index) => (
            <ResultCard key={result.itinerary.id} rank={index + 1} result={result} />
          ))}
        </div>
      ) : null}

      {showMoreAvailable ? (
        <button
          type="button"
          onClick={onShowMore}
          className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50"
        >
          Show more
        </button>
      ) : null}
    </section>
  );
}
