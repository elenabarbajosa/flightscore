import type { Itinerary } from "@/lib/types/search";

export interface ScoringWeights {
  price: number;
  stops: number;
  duration: number;
}

export type ScoringPreset = "CHEAPEST" | "BALANCED" | "FASTEST";

export interface ScoringOptions {
  weights: ScoringWeights;
  showTightConnections: boolean;
}

export interface ScoringBreakdown {
  finalScore: number;
  baseScore: number;
  priceNorm: number;
  stopsNorm: number;
  durationNorm: number;
  priceContribution: number;
  stopsContribution: number;
  durationContribution: number;
  totalPenaltyFactor: number;
  riskyConnectionCount: number;
  longLayoverCount: number;
  airportChangeCount: number;
  isRisky: boolean;
  rawWeights: ScoringWeights;
  appliedWeights: ScoringWeights;
}

export interface ScoredItinerary {
  itinerary: Itinerary;
  score: ScoringBreakdown;
}
