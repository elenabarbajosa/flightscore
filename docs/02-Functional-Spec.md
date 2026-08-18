# Functional Specification — Optimized Flight Search

**Version:** 1.4  
**Date:** August 18, 2026  
**Associated document:** 01-PRD.md

---

## 1. Screen map

The MVP has **one primary search/results experience** with three zones:

```text
┌─────────────────────────────────────┐
│  A. Search form                     │
├─────────────────────────────────────┤
│  B. Preferences panel (weights)     │
├─────────────────────────────────────┤
│  C. Ranked results list             │
└─────────────────────────────────────┘
```

The results area appears after the first search. The MVP should remain focused and must not introduce unnecessary application sections or navigation.

---

## 2. User stories

### US-01 — Search for a flight

> As a traveler, I want to enter an origin, destination, and dates so that I can see available flights.

**Acceptance criteria:**

- [ ] Origin and destination accept a city name or IATA code, with autocomplete backed by a **local/static airport dataset** (not SerpApi).
- [ ] Return date is optional (one-way search is supported).
- [ ] Return date cannot be earlier than departure date.
- [ ] Past departure dates cannot be searched.
- [ ] Passenger count ranges from 1 to 9.
- [ ] Cabin class options are: Economy, Premium Economy, Business, First.
- [ ] When required fields are incomplete, the search button is disabled and the missing information is indicated.
- [ ] A loading state is shown during search and double submission is prevented.

---

### US-02 — Adjust my priorities

> As a traveler, I want to indicate how much I care about price, stops, and duration so that the ranking reflects my priorities.

**Acceptance criteria:**

- [ ] There are three controls: **Price**, **Stops**, **Duration**, each ranging from 0 to 10.
- [ ] Default values: Price 5, Stops 3, Duration 5.
- [ ] Moving a control reorders the list in under 300 ms without a new SerpApi search.
- [ ] Three one-click presets exist: *Cheapest*, *Balanced*, *Fastest*.
- [ ] If all three weights are 0, a warning is shown and the last valid ordering is retained.

---

### US-03 — Understand why a flight ranks where it does

> As a traveler, I want to see the score breakdown so that I can trust the ranking.

**Acceptance criteria:**

- [ ] Each result shows its overall score (0–100).
- [ ] Expanding a result shows the three sub-scores and any penalties applied.
- [ ] Penalties are explained in plain English, not technical jargon (e.g. "Tight 50 min connection at CDG").

---

### US-04 — Avoid problematic connections

> As a traveler, I want the system to warn me about risky connections or excessive layovers.

**Acceptance criteria:**

- [ ] Any connection under 60 min (domestic / intra-Schengen) or 90 min (international) is marked as **risky** with a visual indicator.
- [ ] Any layover over 5 h is marked as a **long layover**.
- [ ] Risky itineraries receive score penalties.
- [ ] With **Show tight connections** disabled (default), **non-risky itineraries fill positions 1–5 first**; if fewer than five non-risky itineraries exist, remaining positions 1–5 are filled by risky itineraries in score order; positions 6 onward contain the remaining itineraries in score order; no ranking positions are left empty when results exist.
- [ ] With **Show tight connections** enabled, all itineraries use normal score ordering while retaining all penalties.
- [ ] An airport change within the same city (e.g. CDG → ORY) is always treated as risky regardless of duration.

---

### US-05 — Understand the result at a glance

> As a traveler, I want to immediately see the information that determines my purchase decision.

**Acceptance criteria:**

- [ ] Each result card shows: total price, total door-to-door duration, number of stops and stop airports, operating airline(s), departure and arrival times, and a next-day arrival indicator (+1) where applicable.
- [ ] The **operating airline** is displayed as the primary airline; if `operatingCarrier` is missing, fall back to `marketingCarrier`; when both exist and differ, show `operatingCarrier`.
- [ ] Round-trip itineraries show outbound and inbound journeys separately.
- [ ] An outbound **View deal** / booking link opens the airline or OTA in a new tab.
- [ ] All valid returned results are scored client-side; the first **30** are rendered initially. **Show more** reveals additional already-scored results without a new SerpApi search.

---

### US-06 — Handle errors and empty states

> As a traveler, I want to understand what happened when something fails.

**Acceptance criteria:**

- [ ] If SerpApi returns no results, show an explanatory message and suggest changing dates or airport.
- [ ] If SerpApi fails or quota is exhausted, show a non-technical message and a retry option.
- [ ] If the search exceeds 15 s, cancel it and inform the user.
- [ ] No error exposes stack traces, SerpApi payloads, or credentials.

---

## 3. Business rules

| ID | Rule |
|---|---|
| BR-01 | Total duration is measured from departure at the origin to arrival at the final destination, including layovers. For round trips, scoring uses the sum of outbound and inbound journey durations. |
| BR-02 | Risky connection: < 60 min when `connectionType` is `DOMESTIC` or `SCHENGEN`; < 90 min when `connectionType` is `INTERNATIONAL`; always risky if an airport change is required. |
| BR-03 | Long layover: > 5 h between consecutive flights. Layover duration is calculated from timezone-aware ISO timestamps as elapsed time between segment arrival and the next segment departure. |
| BR-04 | Only itineraries with a maximum of **2 stops per journey direction** (outbound and inbound evaluated separately) are considered. |
| BR-05 | Prices are shown in euros, as the total for all passengers, including taxes. Request EUR directly from SerpApi / Google Flights whenever supported; if the provider supports its own currency conversion, use that. Do not add a separate FX service during the MVP unless SerpApi makes it necessary. |
| BR-06 | Prices are labeled as estimated; final confirmation is the responsibility of the end provider. |
| BR-07 | Results are cached for 30 minutes using a key composed of origin, destination, departure date, return date (use the literal sentinel `"ONE_WAY"` when absent), passengers, and cabin class. |
| BR-08 | The MVP user interface is English only. No localization or internationalization system is required. |
| BR-09 | For round-trip scoring, use **total itinerary values**: total price, outbound + inbound duration, and total stops across both directions. |
| BR-10 | Airport-change penalties stack with risky-connection penalties when both apply to the same layover. |
| BR-11 | A **valid itinerary** is successfully normalized, contains all fields required for scoring, meets the maximum 2 stops per direction rule, and can be scored and ranked. Risky itineraries are still valid itineraries. |

---

## 4. Scoring formula (v1 — frozen for the MVP)

For each **valid** itinerary in the result set:

**Scoring inputs**

| Input | One-way | Round trip |
|---|---|---|
| `price` | Total itinerary price | Total itinerary price |
| `duration` | Outbound door-to-door duration | Outbound duration + inbound duration |
| `stops` | Outbound stop count | Outbound stops + inbound stops |

**Step 1 — Normalization.** Each variable is mapped to a 0–1 range, where 1 is best:

```text
price_norm     = (price_max - price)       / (price_max - price_min)
duration_norm  = (duration_max - duration) / (duration_max - duration_min)
stops_norm     = (stops_max - stops)       / (stops_max - stops_min)
```

If the denominator is 0 (all values are equal), the normalized value is 1 for all itineraries.

**Step 2 — Weighted combination.** User weights are normalized so that they sum to 1:

```text
base = w_price × price_norm + w_stops × stops_norm + w_duration × duration_norm
```

**Step 3 — Penalties.** Penalties are multiplicative and **stack independently**:

```text
factor = 1
for each risky connection:  factor × 0.75
for each long layover:       factor × 0.90
for each airport change:     factor × 0.70

final_score = base × factor × 100
```

An airport change is always treated as risky. When both apply to the same layover, **both** the risky-connection penalty and the airport-change penalty are applied (e.g. `× 0.75 × 0.70`).

**Step 4 — Sorting.** Results are sorted from highest to lowest `final_score`. If two itineraries tie, the lower-priced itinerary wins.

**Step 5 — Top-5 risky prioritization (default).** When **Show tight connections** is disabled:

1. Sort all valid itineraries by `final_score` (Step 4).
2. Partition into non-risky and risky lists, each preserving score order.
3. Fill positions 1–5 with non-risky itineraries first; if fewer than five non-risky itineraries exist, fill the remaining positions with risky itineraries in score order.
4. Append all remaining itineraries from position 6 onward in score order.
5. Never leave ranking positions empty when results exist.

When **Show tight connections** is enabled, skip steps 2–4 and use normal score ordering for all itineraries; penalties still apply.

> **Developer note:** this formula must not be modified during the MVP. Any adjustment must be documented as a version change and agreed with the Product Owner. The purpose is to prevent endless tuning before real usage data exists.

---

## 5. Weight presets

| Preset | Price | Stops | Duration |
|---|---:|---:|---:|
| Cheapest | 9 | 2 | 2 |
| Balanced (default) | 5 | 3 | 5 |
| Fastest | 2 | 5 | 9 |

---

## 6. Connection classification

Each layover includes a `connectionType` used to evaluate risky-connection thresholds:

| Value | Threshold | Description |
|---|---|---|
| `DOMESTIC` | 60 min | Both airports are in the same country. |
| `SCHENGEN` | 60 min | Airports are in different Schengen member states. |
| `INTERNATIONAL` | 90 min | All other cross-border connections. |

Classification is determined during normalization from segment endpoints and airport `countryCode` metadata in the static dataset. Maintain an explicit Schengen member **country-code set in code**; determine an airport’s Schengen status from its `countryCode`.

---

## 7. Static airport dataset

The local/static airport dataset supports autocomplete and connection classification.

**Minimum fields per airport:**

| Field | Purpose |
|---|---|
| `iata` | Airport code lookup and display |
| `name` | Autocomplete label |
| `city` | Autocomplete label |
| `countryCode` | Domestic / Schengen / international connection classification |
| `latitude` | Optional future use; bundled for completeness |
| `longitude` | Optional future use; bundled for completeness |
