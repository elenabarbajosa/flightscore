"use client";

import { useCallback, useMemo, useState } from "react";

import { PreferencePanel } from "@/components/search/PreferencePanel";
import { ResultsPanel } from "@/components/search/ResultsPanel";
import { SearchForm } from "@/components/search/SearchForm";
import {
  detectActivePreset,
  sanitizeWeightChange,
  type ActivePreset,
} from "@/lib/client/preferences";
import { searchFlights, SearchApiError } from "@/lib/client/search-api";
import {
  applyFailedSearch,
  applySuccessfulSearch,
  createEmptySearchResultsState,
  getNextVisibleCount,
  INITIAL_VISIBLE_COUNT,
  scoreStoredItineraries,
  shouldShowMoreControl,
} from "@/lib/client/search-results";
import {
  buildSearchRequest,
  createEmptySearchFormValues,
  hasSearchFormErrors,
  validateSearchForm,
  type SearchFormErrors,
  type SearchFormValues,
} from "@/lib/client/search-form-validation";
import { DEFAULT_WEIGHTS, SCORING_PRESETS } from "@/lib/scoring";
import type { ScoringWeights } from "@/lib/types/scoring";

export function SearchPage() {
  const [formValues, setFormValues] = useState<SearchFormValues>(
    createEmptySearchFormValues(),
  );
  const [formErrors, setFormErrors] = useState<SearchFormErrors>({});
  const [resultsState, setResultsState] = useState(createEmptySearchResultsState);
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [activePreset, setActivePreset] = useState<ActivePreset>("BALANCED");
  const [showTightConnections, setShowTightConnections] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const scoredResults = useMemo(
    () =>
      scoreStoredItineraries(resultsState.itineraries, {
        weights,
        showTightConnections,
      }),
    [resultsState.itineraries, weights, showTightConnections],
  );

  const hasSuccessfulSearch = resultsState.itineraries.length > 0;

  const handleSearch = useCallback(async () => {
    const errors = validateSearchForm(formValues);

    if (hasSearchFormErrors(errors)) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSearching(true);
    setSearchError(null);

    try {
      const request = buildSearchRequest(formValues);
      const response = await searchFlights(request);

      setResultsState(applySuccessfulSearch(response, request));
      setVisibleCount(INITIAL_VISIBLE_COUNT);
      setSearchError(null);
    } catch (error) {
      const message =
        error instanceof SearchApiError
          ? error.message
          : "Something went wrong. Please try again.";

      setSearchError(message);
      setResultsState((current) => applyFailedSearch(current));
    } finally {
      setIsSearching(false);
    }
  }, [formValues]);

  const handlePresetSelect = useCallback(
    (preset: Exclude<ActivePreset, "CUSTOM">) => {
      setWeights(SCORING_PRESETS[preset]);
      setActivePreset(preset);
      setPreferenceError(null);
    },
    [],
  );

  const handleWeightChange = useCallback(
    (dimension: keyof ScoringWeights, value: number) => {
      const nextWeights = sanitizeWeightChange(weights, dimension, value);

      if (!nextWeights) {
        setPreferenceError("At least one preference must be greater than zero.");
        return;
      }

      setWeights(nextWeights);
      setActivePreset(detectActivePreset(nextWeights, SCORING_PRESETS));
      setPreferenceError(null);
    },
    [weights],
  );

  const handleShowMore = useCallback(() => {
    setVisibleCount((current) =>
      getNextVisibleCount(scoredResults.length, current),
    );
  }, [scoredResults.length]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-5 lg:mb-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-accent"
          />
          <p className="text-sm font-semibold tracking-tight text-neutral-900">
            FlightScore
          </p>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Compare long-haul options ranked by what matters most to you.
        </p>
      </header>

      <SearchForm
        values={formValues}
        errors={formErrors}
        isSearching={isSearching}
        onChange={setFormValues}
        onSubmit={() => {
          void handleSearch();
        }}
      />

      <div className="mt-5 lg:mt-6 lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[18.75rem_minmax(0,1fr)]">
        <aside className="mt-5 lg:sticky lg:top-6 lg:mt-0">
          <PreferencePanel
            weights={weights}
            activePreset={activePreset}
            showTightConnections={showTightConnections}
            preferenceError={preferenceError}
            onPresetSelect={handlePresetSelect}
            onWeightChange={handleWeightChange}
            onShowTightConnectionsChange={setShowTightConnections}
          />
        </aside>

        <ResultsPanel
          searchContext={resultsState.searchContext}
          scoredResults={scoredResults}
          visibleCount={visibleCount}
          searchError={searchError}
          isSearching={isSearching}
          hasSuccessfulSearch={hasSuccessfulSearch}
          onShowMore={handleShowMore}
          showMoreAvailable={shouldShowMoreControl(
            scoredResults.length,
            visibleCount,
          )}
        />
      </div>
    </main>
  );
}
