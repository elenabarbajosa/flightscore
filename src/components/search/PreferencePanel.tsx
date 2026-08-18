"use client";

import type { CSSProperties } from "react";

import type { ScoringWeights } from "@/lib/types/scoring";
import type { ActivePreset } from "@/lib/client/preferences";
import { WEIGHT_MAX, WEIGHT_MIN } from "@/lib/client/preferences";

interface PreferencePanelProps {
  weights: ScoringWeights;
  activePreset: ActivePreset;
  showTightConnections: boolean;
  preferenceError: string | null;
  onPresetSelect: (preset: Exclude<ActivePreset, "CUSTOM">) => void;
  onWeightChange: (dimension: keyof ScoringWeights, value: number) => void;
  onShowTightConnectionsChange: (value: boolean) => void;
}

const PRESET_OPTIONS: Array<{
  id: Exclude<ActivePreset, "CUSTOM">;
  label: string;
}> = [
  { id: "CHEAPEST", label: "Cheapest" },
  { id: "BALANCED", label: "Balanced" },
  { id: "FASTEST", label: "Fastest" },
];

const WEIGHT_FIELDS: Array<{
  key: keyof ScoringWeights;
  label: string;
}> = [
  { key: "price", label: "Price" },
  { key: "stops", label: "Stops" },
  { key: "duration", label: "Duration" },
];

function getRangeProgress(value: number): string {
  return `${(value / WEIGHT_MAX) * 100}%`;
}

export function PreferencePanel({
  weights,
  activePreset,
  showTightConnections,
  preferenceError,
  onPresetSelect,
  onWeightChange,
  onShowTightConnectionsChange,
}: PreferencePanelProps) {
  return (
    <section className="fs-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
            Rank flights by what matters to you
          </h2>
          {activePreset === "CUSTOM" ? (
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-accent-muted">
              Custom weights
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <div className="fs-preset-group w-full">
          {PRESET_OPTIONS.map((preset) => {
            const isActive = activePreset === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPresetSelect(preset.id)}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-white text-accent shadow-sm ring-1 ring-neutral-200"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        {WEIGHT_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`weight-${field.key}`}
                className="text-xs font-medium text-neutral-700"
              >
                {field.label}
              </label>
              <span className="text-xs font-semibold tabular-nums text-neutral-900">
                {weights[field.key]}
              </span>
            </div>
            <input
              id={`weight-${field.key}`}
              type="range"
              min={WEIGHT_MIN}
              max={WEIGHT_MAX}
              step={1}
              value={weights[field.key]}
              style={
                {
                  "--fs-range-progress": getRangeProgress(weights[field.key]),
                } as CSSProperties
              }
              onChange={(event) =>
                onWeightChange(field.key, Number.parseInt(event.target.value, 10))
              }
              className="fs-range"
            />
          </div>
        ))}
      </div>

      {preferenceError ? (
        <p className="mt-3 text-[11px] text-rose-700">{preferenceError}</p>
      ) : null}

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-800">
              Show tight connections
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-neutral-500">
              Rank risky connections in normal score order.
            </p>
          </div>
          <label className="relative shrink-0">
            <input
              type="checkbox"
              checked={showTightConnections}
              onChange={(event) =>
                onShowTightConnectionsChange(event.target.checked)
              }
              className="peer sr-only"
            />
            <span className="fs-toggle" aria-hidden="true" />
          </label>
        </div>
      </div>
    </section>
  );
}
