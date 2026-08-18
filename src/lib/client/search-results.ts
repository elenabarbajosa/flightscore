import type { Itinerary, SearchRequest } from "@/lib/types/search";
import type { ScoredItinerary, ScoringOptions } from "@/lib/types/scoring";
import { scoreItineraries } from "@/lib/scoring";

export const INITIAL_VISIBLE_COUNT = 30;
export const SHOW_MORE_STEP = 30;

export interface SearchContext {
  origin: string;
  destination: string;
  tripType: "One-way" | "Round trip";
  resultCount: number;
  cached: boolean;
}

export interface SearchResultsState {
  itineraries: Itinerary[];
  searchContext: SearchContext | null;
}

export function createEmptySearchResultsState(): SearchResultsState {
  return {
    itineraries: [],
    searchContext: null,
  };
}

export function applySuccessfulSearch(
  response: { results: Itinerary[]; cached: boolean },
  request: SearchRequest,
): SearchResultsState {
  return {
    itineraries: response.results,
    searchContext: {
      origin: request.origin,
      destination: request.destination,
      tripType: request.returnDate ? "Round trip" : "One-way",
      resultCount: response.results.length,
      cached: response.cached,
    },
  };
}

export function applyFailedSearch(
  previous: SearchResultsState,
): SearchResultsState {
  return previous;
}

export function scoreStoredItineraries(
  itineraries: Itinerary[],
  options: ScoringOptions,
): ScoredItinerary[] {
  return scoreItineraries(itineraries, options);
}

export function getVisibleScoredResults(
  scoredResults: ScoredItinerary[],
  visibleCount: number,
): ScoredItinerary[] {
  return scoredResults.slice(0, visibleCount);
}

export function getNextVisibleCount(
  totalResults: number,
  visibleCount: number,
): number {
  return Math.min(totalResults, visibleCount + SHOW_MORE_STEP);
}

export function shouldShowMoreControl(
  totalResults: number,
  visibleCount: number,
): boolean {
  return totalResults > visibleCount;
}
