# PRD — Optimized Flight Search

**Document:** Product Requirements Document  
**Version:** 1.4  
**Date:** August 18, 2026  
**Sponsor / Product Owner:** José Luis Barbajosa  
**Audience:** Development team

---

## 1. Executive summary

Current flight search engines (Skyscanner, Google Flights, Kayak) tend to rank by price or duration in isolation, forcing users to manually compare dozens of itineraries to find the trade-off that actually suits them.

This product solves that problem with a **multi-criteria scoring engine**: the user defines how important each variable is (price, stops, duration) through adjustable controls, and the system recalculates the ranking in real time.

FlightScore is a **search and ranking engine only**. It does not sell tickets, process bookings, or handle flight payments. Users complete booking with the airline or OTA via outbound links.

The initial focus is **long-haul travel**, where differences between itineraries are larger and poor connections have a higher real-world cost.

---

## 2. Problem and opportunity

| Problem | User impact |
|---|---|
| Ranking by price can hide 30–40h itineraries with 3 stops | The user buys "cheap" but loses an entire day |
| Filters are binary (non-stop / 1 stop / 2+) | They cannot express "I would pay €80 more to save 6 hours" |
| Risky connections are not adequately penalized | 45-minute layovers at large airports can lead to missed flights |
| A 9h layover can be treated similarly to a 2h layover | The true travel burden is hidden behind the number of stops |

**Opportunity:** a small set of intuitive preference controls can solve in seconds what currently requires opening and comparing many tabs.

---

## 3. Product objectives

### Primary objectives

1. Allow users to search for long-haul flights and receive a ranking that combines price, stops, and duration according to their preferences.
2. Automatically detect and penalize risky connections (too short) and unproductive layovers (too long).
3. Recalculate the ranking in under 300 ms when the user changes a weight, without calling SerpApi again.

### Secondary objectives (outside the MVP)

- Flexible-date search (±3 days).
- Search history and price alerts.
- Multi-city and open-jaw support.

### Non-goals (explicitly out of scope)

- The product does not make bookings, sell tickets, or process payments. It redirects the user to the airline or OTA to complete booking.
- It does not manage hotels, cars, or insurance.
- There are no user accounts in the MVP.
- There is no PWA or native mobile app in the MVP.

---

## 4. Target user

**Primary profile:** a frequent or semi-frequent long-haul traveler who values time as well as price. They travel for business or with family and are already familiar with existing flight search engines.

**Usage scenarios:**

- *Intercontinental business trip:* prioritizes duration and connection reliability and accepts paying more.
- *Family trip:* prioritizes price but rejects itineraries with overnight or risky connections.
- *Flexible decision-making:* explores the price/time trade-off by adjusting preferences before choosing.

---

## 5. Success metrics

| Metric | MVP target |
|---|---|
| Search response time (p95) | < 5 s |
| Recalculation time after changing a weight | < 300 ms |
| Searches returning ≥ 10 **valid itineraries** | > 90% |
| Positions 1–5 contain only non-risky itineraries when ≥ 5 non-risky results exist (default settings) | 100% |
| Unhandled API errors visible to the user | 0 |

---

## 6. MVP functional scope

### Included

- Search form: origin, destination, departure date, optional return date, number of passengers, cabin class.
- Airport autocomplete from a **local/static airport dataset** (independent of SerpApi).
- Server-side flight search via **SerpApi using the Google Flights API**, with normalization into the internal FlightScore contract (EUR pricing where supported, layover metadata, connection classification).
- Scoring engine with three user-adjustable weights and one-click presets (*Cheapest*, *Balanced*, *Fastest*).
- Automatic penalties based on layover quality, with **Show tight connections** toggle controlling top-5 risky prioritization (non-risky first in positions 1–5).
- Results list ordered by score, with expandable breakdown explaining sub-scores and penalties.
- All valid results scored client-side; first 30 rendered, **Show more** for additional already-scored results.
- Outbound link to the corresponding airline or OTA for booking completion.
- Operating airline shown as primary on codeshare itineraries.
- Responsive, mobile-first design with Tailwind CSS.
- English-only user interface for the MVP.
- Per-IP rate limiting (`POST /api/search`: 10 requests / 10 minutes; `POST /api/deal`: 20 requests / 10 minutes) before final delivery.

### Excluded from the MVP

Flexible dates, alerts, user accounts, multi-city, included-baggage comparison, multi-currency display, localization/internationalization infrastructure, **PWA support**, and native iOS/Android apps.

---

## 7. Risks and mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Free-tier SerpApi quota limits | High | Medium | Cache by origin, destination, departure date, return date (`"ONE_WAY"` when absent), passengers, and cabin class (30 min TTL); quota counter and hard usage controls |
| SerpApi / Google Flights prices differ from the airline website | Medium | Medium | Label prices as "estimated"; provide a direct link for final confirmation |
| Incomplete airline / low-cost coverage via Google Flights | Medium | Medium | Document the limitation; keep the provider layer replaceable and evaluate complementary sources if needed |
| Overengineering the scoring model | Medium | High | Freeze the v1 formula for the MVP; do not iterate until real usage data exists |
| SerpApi API key leakage | Low | High | All SerpApi calls go through the server; credentials never appear in client code |
| SerpApi dependency | Medium | High | Keep all SerpApi-specific logic isolated behind a provider abstraction |

---

## 8. External dependencies

- SerpApi developer account and API key for the **Google Flights API** engine.
- Hosting account for the Next.js application and server-side functions (Vercel preferred for the MVP).
- Domain (optional for the MVP).
- Static airport dataset for autocomplete (bundled with the application; minimum fields: `iata`, `name`, `city`, `countryCode`, `latitude`, `longitude`).

**Valid itinerary:** successfully normalized; contains all fields required for scoring; meets the maximum 2 stops per direction rule; can be scored and ranked. Risky itineraries are still valid itineraries.

**Provider policy:** the MVP flight-data provider is **SerpApi using the Google Flights API**. SerpApi is not a permanent architectural dependency. SerpApi-specific logic must remain isolated so the provider can be replaced without changing the scoring engine or UI.

---

## 9. Project acceptance criteria

The project is considered delivered when:

1. A real long-haul search via SerpApi returns results ordered by score in under 5 seconds.
2. Changing any weight or preset reorders the list without a new SerpApi request.
3. With default settings and **Show tight connections** disabled, non-risky itineraries fill ranking positions 1–5 first; if fewer than five non-risky itineraries exist, remaining positions 1–5 are filled by risky itineraries in score order; no ranking positions are left empty when results exist.
4. Expanding a result shows score sub-components and plain-English penalty explanations.
5. SerpApi credentials are not accessible from the browser (verified in client source and the network panel).
6. The application is usable on a 375 px-wide mobile screen without horizontal scrolling.
7. Per-IP rate limiting is active (`POST /api/search`: 10 / 10 minutes; `POST /api/deal`: 20 / 10 minutes).
8. A README exists with installation, environment-variable, and deployment instructions.
