"use client";

import type { CabinClass } from "@/lib/types/search";
import type {
  SearchFormErrors,
  SearchFormValues,
} from "@/lib/client/search-form-validation";

import { AirportAutocomplete } from "@/components/search/AirportAutocomplete";

interface SearchFormProps {
  values: SearchFormValues;
  errors: SearchFormErrors;
  isSearching: boolean;
  onChange: (values: SearchFormValues) => void;
  onSubmit: () => void;
}

const CABIN_OPTIONS: Array<{ value: CabinClass; label: string }> = [
  { value: "ECONOMY", label: "Economy" },
  { value: "PREMIUM_ECONOMY", label: "Premium economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-[11px] text-rose-700">{message}</p>;
}

export function SearchForm({
  values,
  errors,
  isSearching,
  onChange,
  onSubmit,
}: SearchFormProps) {
  function updateField<K extends keyof SearchFormValues>(
    field: K,
    value: SearchFormValues[K],
  ) {
    onChange({ ...values, [field]: value });
  }

  return (
    <form
      className="fs-search-surface"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,0.75fr)_auto] lg:items-end">
        <div className="border-b border-neutral-200 p-3 lg:border-b-0 lg:border-r lg:p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
            <AirportAutocomplete
              id="origin"
              label="From"
              value={values.origin}
              error={errors.origin}
              onChange={(origin) => updateField("origin", origin)}
            />
            <span
              aria-hidden="true"
              className="pb-2 text-sm font-medium text-neutral-400"
            >
              →
            </span>
            <AirportAutocomplete
              id="destination"
              label="To"
              value={values.destination}
              error={errors.destination}
              onChange={(destination) => updateField("destination", destination)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-neutral-200 border-b border-neutral-200 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-1 p-3 lg:p-4">
            <label htmlFor="departureDate" className="fs-label">
              Departure
            </label>
            <input
              id="departureDate"
              type="date"
              value={values.departureDate}
              onChange={(event) =>
                updateField("departureDate", event.target.value)
              }
              className={`fs-input ${errors.departureDate ? "border-rose-300" : ""}`}
            />
            <FieldError message={errors.departureDate} />
          </div>

          <div className="flex flex-col gap-1 p-3 lg:p-4">
            <label htmlFor="returnDate" className="fs-label">
              Return
            </label>
            <input
              id="returnDate"
              type="date"
              value={values.returnDate}
              onChange={(event) => updateField("returnDate", event.target.value)}
              className={`fs-input ${errors.returnDate ? "border-rose-300" : ""}`}
            />
            <FieldError message={errors.returnDate} />
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-neutral-200 border-b border-neutral-200 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-1 p-3 lg:p-4">
            <label htmlFor="passengers" className="fs-label">
              Passengers
            </label>
            <input
              id="passengers"
              type="number"
              min={1}
              max={9}
              value={values.passengers}
              onChange={(event) => updateField("passengers", event.target.value)}
              className={`fs-input ${errors.passengers ? "border-rose-300" : ""}`}
            />
            <FieldError message={errors.passengers} />
          </div>

          <div className="flex flex-col gap-1 p-3 lg:p-4">
            <label htmlFor="cabinClass" className="fs-label">
              Cabin
            </label>
            <select
              id="cabinClass"
              value={values.cabinClass}
              onChange={(event) =>
                updateField("cabinClass", event.target.value as CabinClass)
              }
              className={`fs-input ${errors.cabinClass ? "border-rose-300" : ""}`}
            >
              {CABIN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.cabinClass} />
          </div>
        </div>

        <div className="p-3 lg:flex lg:items-end lg:p-4">
          <button
            type="submit"
            disabled={isSearching}
            className="h-9 w-full rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-[#0a5653] disabled:cursor-not-allowed disabled:bg-neutral-300 lg:min-w-[8.5rem]"
          >
            {isSearching ? "Searching…" : "Search flights"}
          </button>
        </div>
      </div>
    </form>
  );
}
