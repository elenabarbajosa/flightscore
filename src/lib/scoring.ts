import type { Itinerary, Layover } from "@/lib/types/search";
import type {
  ScoredItinerary,
  ScoringBreakdown,
  ScoringOptions,
  ScoringPreset,
  ScoringWeights,
} from "@/lib/types/scoring";

export const SCORING_PRESETS: Record<ScoringPreset, ScoringWeights> = {
  CHEAPEST: { price: 9, stops: 2, duration: 2 },
  BALANCED: { price: 5, stops: 3, duration: 5 },
  FASTEST: { price: 2, stops: 5, duration: 9 },
};

export const DEFAULT_WEIGHTS: ScoringWeights = SCORING_PRESETS.BALANCED;

const RISKY_CONNECTION_FACTOR = 0.75;
const LONG_LAYOVER_FACTOR = 0.9;
const AIRPORT_CHANGE_FACTOR = 0.7;

interface DatasetBounds {
  priceMin: number;
  priceMax: number;
  durationMin: number;
  durationMax: number;
  stopsMin: number;
  stopsMax: number;
}

interface ResolvedWeights {
  rawWeights: ScoringWeights;
  appliedWeights: ScoringWeights;
}

interface ScoredItineraryInternal extends ScoredItinerary {
  originalIndex: number;
}

function isValidWeight(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function resolveWeights(weights: ScoringWeights): ResolvedWeights {
  if (
    !isValidWeight(weights.price) ||
    !isValidWeight(weights.stops) ||
    !isValidWeight(weights.duration)
  ) {
    return normalizeWeightValues(DEFAULT_WEIGHTS);
  }

  const total = weights.price + weights.stops + weights.duration;

  if (total <= 0) {
    return normalizeWeightValues(DEFAULT_WEIGHTS);
  }

  return normalizeWeightValues(weights);
}

function normalizeWeightValues(weights: ScoringWeights): ResolvedWeights {
  const total = weights.price + weights.stops + weights.duration;

  return {
    rawWeights: {
      price: weights.price,
      stops: weights.stops,
      duration: weights.duration,
    },
    appliedWeights: {
      price: weights.price / total,
      stops: weights.stops / total,
      duration: weights.duration / total,
    },
  };
}

function collectLayovers(itinerary: Itinerary): Layover[] {
  const layovers = [...itinerary.outbound.layovers];

  if (itinerary.inbound) {
    layovers.push(...itinerary.inbound.layovers);
  }

  return layovers;
}

export function isLayoverRisky(layover: Layover): boolean {
  if (layover.airportChange) {
    return true;
  }

  if (layover.connectionType === "INTERNATIONAL") {
    return layover.durationMinutes < 90;
  }

  return layover.durationMinutes < 60;
}

export function isLongLayover(layover: Layover): boolean {
  return layover.durationMinutes > 300;
}

function computePenaltyMetrics(layovers: Layover[]): {
  totalPenaltyFactor: number;
  riskyConnectionCount: number;
  longLayoverCount: number;
  airportChangeCount: number;
} {
  let totalPenaltyFactor = 1;
  let riskyConnectionCount = 0;
  let longLayoverCount = 0;
  let airportChangeCount = 0;

  for (const layover of layovers) {
    if (isLayoverRisky(layover)) {
      totalPenaltyFactor *= RISKY_CONNECTION_FACTOR;
      riskyConnectionCount += 1;
    }

    if (isLongLayover(layover)) {
      totalPenaltyFactor *= LONG_LAYOVER_FACTOR;
      longLayoverCount += 1;
    }

    if (layover.airportChange) {
      totalPenaltyFactor *= AIRPORT_CHANGE_FACTOR;
      airportChangeCount += 1;
    }
  }

  return {
    totalPenaltyFactor,
    riskyConnectionCount,
    longLayoverCount,
    airportChangeCount,
  };
}

function computeDatasetBounds(itineraries: Itinerary[]): DatasetBounds {
  const prices = itineraries.map((itinerary) => itinerary.price);
  const durations = itineraries.map(
    (itinerary) => itinerary.totalDurationMinutes,
  );
  const stops = itineraries.map((itinerary) => itinerary.stopCount);

  return {
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    durationMin: Math.min(...durations),
    durationMax: Math.max(...durations),
    stopsMin: Math.min(...stops),
    stopsMax: Math.max(...stops),
  };
}

function normalizeValue(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) {
    return 1;
  }

  return (max - value) / (max - min);
}

function computeBreakdown(
  itinerary: Itinerary,
  bounds: DatasetBounds,
  resolvedWeights: ResolvedWeights,
): ScoringBreakdown {
  const priceNorm = normalizeValue(
    itinerary.price,
    bounds.priceMin,
    bounds.priceMax,
  );
  const durationNorm = normalizeValue(
    itinerary.totalDurationMinutes,
    bounds.durationMin,
    bounds.durationMax,
  );
  const stopsNorm = normalizeValue(
    itinerary.stopCount,
    bounds.stopsMin,
    bounds.stopsMax,
  );

  const priceContribution =
    priceNorm * resolvedWeights.appliedWeights.price;
  const stopsContribution =
    stopsNorm * resolvedWeights.appliedWeights.stops;
  const durationContribution =
    durationNorm * resolvedWeights.appliedWeights.duration;
  const baseScore =
    priceContribution + stopsContribution + durationContribution;

  const penalties = computePenaltyMetrics(collectLayovers(itinerary));
  const finalScore = baseScore * penalties.totalPenaltyFactor * 100;

  return {
    finalScore,
    baseScore,
    priceNorm,
    stopsNorm,
    durationNorm,
    priceContribution,
    stopsContribution,
    durationContribution,
    totalPenaltyFactor: penalties.totalPenaltyFactor,
    riskyConnectionCount: penalties.riskyConnectionCount,
    longLayoverCount: penalties.longLayoverCount,
    airportChangeCount: penalties.airportChangeCount,
    isRisky: penalties.riskyConnectionCount > 0,
    rawWeights: resolvedWeights.rawWeights,
    appliedWeights: resolvedWeights.appliedWeights,
  };
}

function compareScoredItineraries(
  left: ScoredItineraryInternal,
  right: ScoredItineraryInternal,
): number {
  if (left.score.finalScore !== right.score.finalScore) {
    return right.score.finalScore - left.score.finalScore;
  }

  if (left.itinerary.price !== right.itinerary.price) {
    return left.itinerary.price - right.itinerary.price;
  }

  return left.originalIndex - right.originalIndex;
}

function sortScoredItineraries(
  scored: ScoredItineraryInternal[],
): ScoredItineraryInternal[] {
  return [...scored].sort(compareScoredItineraries);
}

function applyTopFivePrioritization(
  sorted: ScoredItineraryInternal[],
): ScoredItineraryInternal[] {
  const nonRisky = sorted.filter((entry) => !entry.score.isRisky);
  const risky = sorted.filter((entry) => entry.score.isRisky);
  const topFive = [
    ...nonRisky.slice(0, 5),
    ...risky.slice(0, Math.max(0, 5 - nonRisky.length)),
  ];
  const topFiveIds = new Set(topFive.map((entry) => entry.itinerary.id));
  const remaining = sorted.filter(
    (entry) => !topFiveIds.has(entry.itinerary.id),
  );

  return [...topFive, ...remaining];
}

function stripInternalFields(
  scored: ScoredItineraryInternal[],
): ScoredItinerary[] {
  return scored.map(({ itinerary, score }) => ({
    itinerary,
    score,
  }));
}

export function scoreItineraries(
  itineraries: Itinerary[],
  options: ScoringOptions,
): ScoredItinerary[] {
  if (itineraries.length === 0) {
    return [];
  }

  const resolvedWeights = resolveWeights(options.weights);
  const bounds = computeDatasetBounds(itineraries);
  const scored = itineraries.map((itinerary, originalIndex) => ({
    itinerary,
    originalIndex,
    score: computeBreakdown(itinerary, bounds, resolvedWeights),
  }));

  const sorted = sortScoredItineraries(scored);
  const ranked = options.showTightConnections
    ? sorted
    : applyTopFivePrioritization(sorted);

  return stripInternalFields(ranked);
}

export function compareScoredResults(
  left: ScoredItinerary,
  leftIndex: number,
  right: ScoredItinerary,
  rightIndex: number,
): number {
  return compareScoredItineraries(
    { ...left, originalIndex: leftIndex },
    { ...right, originalIndex: rightIndex },
  );
}
