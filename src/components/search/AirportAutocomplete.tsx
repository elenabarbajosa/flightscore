"use client";

import { useId, useMemo, useState } from "react";

import { searchAirports } from "@/lib/airports";
import { normalizeIataInput } from "@/lib/client/search-form-validation";

interface AirportAutocompleteProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function AirportAutocomplete({
  id,
  label,
  value,
  error,
  onChange,
  className = "",
}: AirportAutocompleteProps) {
  const listId = useId();
  const [isFocused, setIsFocused] = useState(false);
  const suggestions = useMemo(
    () => (isFocused ? searchAirports(value) : []),
    [isFocused, value],
  );

  return (
    <div className={`relative flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="fs-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={3}
        value={value}
        list={listId}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          window.setTimeout(() => setIsFocused(false), 120);
        }}
        onChange={(event) => onChange(normalizeIataInput(event.target.value))}
        className={`fs-input fs-input-code ${error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""}`}
        placeholder="IATA"
      />
      <datalist id={listId}>
        {suggestions.map((airport) => (
          <option
            key={airport.iata}
            value={airport.iata}
            label={`${airport.city} — ${airport.name}`}
          />
        ))}
      </datalist>

      {isFocused && suggestions.length > 0 ? (
        <ul
          role="listbox"
          className="absolute top-full z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-sm"
        >
          {suggestions.map((airport) => (
            <li key={airport.iata}>
              <button
                type="button"
                role="option"
                aria-selected={value === airport.iata}
                className="flex w-full items-start gap-3 px-3 py-2 text-left transition hover:bg-neutral-50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onChange(airport.iata)}
              >
                <span className="w-9 shrink-0 text-sm font-semibold tracking-[0.12em] text-neutral-900">
                  {airport.iata}
                </span>
                <span className="min-w-0 text-xs leading-5 text-neutral-600">
                  <span className="block truncate font-medium text-neutral-800">
                    {airport.city}
                  </span>
                  <span className="block truncate">{airport.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="text-[11px] text-rose-700">{error}</p> : null}
    </div>
  );
}
