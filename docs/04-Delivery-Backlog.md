# Delivery Plan and Backlog — Optimized Flight Search

**Version:** 1.3  
**Date:** August 18, 2026  
**Associated documents:** 01-PRD.md, 02-Functional-Spec.md, 03-Technical-Spec.md

---

## 1. Phases and milestones

| Phase | Scope | Estimated duration | Exit milestone |
|---|---|---:|---|
| **F0 — Foundation** | Repository, Next.js + TypeScript + Tailwind skeleton, documentation, mock-data setup, static airport dataset, empty deployment, provider-selection decision | 2–3 days | Application skeleton deployed at the test URL |
| **F1 — Functional backend** | `/api/search`, selected provider integration, normalization, caching (`lib/cache.ts`), EUR handling | 5–7 days | A real provider call returns JSON matching the internal contract |
| **F2 — Scoring engine** | `lib/scoring.ts` with normalization, weights, penalties, top-5 risky prioritization + tests | 3–4 days | Scoring and normalization tests pass for normal and edge cases |
| **F3 — Interface** | Search form, preference controls, presets, score breakdown, tight-connections toggle, result cards, loading / empty / error states | 5–7 days | Complete flow usable on mobile |
| **F4 — Closure** | Visual polish, error handling, rate limiting, README, deployment checks, security review | 2–3 days | PRD acceptance criteria passed |

**Estimated total duration:** 3–4 weeks of work for one developer.

> These estimates are indicative and should be confirmed during implementation before any delivery commitment is made.

---

## 2. Prioritized backlog

### Priority 1 — Essential (no product without these)

| ID | Task | Phase | US |
|---|---|---|---|
| T-01 | Create repository, Next.js + TypeScript + Tailwind project structure, and continuous deployment | F0 | — |
| T-02 | Add typed mock itinerary data and establish the initial search/results flow | F0 | US-01 / US-05 |
| T-03 | Add local/static airport dataset (min. fields: iata, name, city, countryCode, latitude, longitude) and autocomplete helpers | F0 | US-01 |
| T-04 | Add explicit Schengen country-code set (`lib/schengen.ts`) | F0 | US-04 |
| T-05 | Evaluate and select the initial flight-data provider; obtain credentials | F0 | — |
| T-06 | Implement provider abstraction and provider authentication | F1 | — |
| T-07 | Implement `/api/search` with input validation | F1 | US-01 |
| T-08 | Normalize provider responses into the internal contract (EUR via provider, layovers, `connectionType`) | F1 | US-05 |
| T-09 | Detect layovers: timezone-aware duration, airport change, `connectionType` | F1 | US-04 |
| T-10 | Add search-result caching via `lib/cache.ts` with full cache key (`"ONE_WAY"` sentinel) and TTL | F1 | — |
| T-11 | Implement the complete scoring module with penalties and top-5 risky prioritization | F2 | US-02 / US-04 |
| T-12 | Add unit tests for scoring (`lib/scoring.ts`), including top-5 edge cases | F2 | US-03 |
| T-13 | Add unit tests for normalization (`lib/normalize.ts`) | F2 | — |
| T-14 | Build the search form with static airport autocomplete | F3 | US-01 |
| T-15 | Build preference controls with client-side recalculation | F3 | US-02 |
| T-16 | Add one-click presets (Cheapest / Balanced / Fastest) | F3 | US-02 |
| T-17 | Add expandable score breakdown | F3 | US-03 |
| T-18 | Add **Show tight connections** toggle | F3 | US-04 |
| T-19 | Build complete flight-result cards (operating-carrier fallback, Show more for results beyond 30) | F3 | US-05 |
| T-20 | Add visual indicators for risky connections and long layovers | F3 | US-04 |
| T-21 | Add loading, empty, and error states | F3 | US-06 |
| T-22 | Ensure responsive design from 375 px | F3 | — |
| T-23 | Implement per-IP rate limiting and quota-protection controls | F4 | — |
| T-24 | Complete README, `.env.example`, deployment validation, and security review | F4 | — |

### Priority 2 — Desirable (improves the MVP but does not block the first usable build)

None at this time. All MVP features are Priority 1.

### Priority 3 — Outside the MVP (future backlog)

Flexible dates ±3 days · Price alerts · Search history · Multi-city · Airline/alliance filter · Included-baggage comparison · Multi-currency display · User accounts · Localization · **PWA support**.

---

## 3. Definition of Done

A task is complete only when **all** applicable conditions are met:

- [ ] Code is committed and available in the active development branch / main branch according to the project workflow.
- [ ] Associated acceptance criteria are manually verified.
- [ ] There are no relevant errors in the browser console or server logs.
- [ ] The feature works on mobile (375 px) and desktop.
- [ ] No credentials, secret keys, or internal provider details are exposed in client-side code.
- [ ] Error cases are handled with an English user-facing message.
- [ ] If the task modifies scoring or normalization, appropriate unit tests exist.
- [ ] Lint, typecheck, and tests pass before the task is considered complete.

---

## 4. Acceptance test plan

Before final delivery, execute and document these scenarios:

| # | Scenario | Expected result |
|---|---|---|
| P-01 | Round-trip search LIS → NRT, 2 passengers, Economy | ≥ 10 results in < 5 s |
| P-02 | Change Price weight from 5 to 9 | Instant reordering, no network call |
| P-03 | Apply **Fastest** preset | The first result is the lowest reasonable total-duration itinerary |
| P-04 | Search a route with no available flights | Empty-state message with a useful suggestion |
| P-05 | Simulate provider failure | Readable English message and retry option |
| P-06 | Inspect client source and browser network panel | No provider credentials visible |
| P-07 | Repeat the same search twice within 5 minutes | Second response is marked cached and should be faster |
| P-08 | Review top 5 with default configuration, ≥ 5 non-risky results, **Show tight connections** disabled | Positions 1–5 contain only non-risky itineraries |
| P-08b | Review top 5 with default configuration, < 5 non-risky results, **Show tight connections** disabled | Positions 1–N (N = non-risky count) are non-risky; remaining positions 1–5 filled by risky in score order; no empty positions |
| P-09 | Enable **Show tight connections** | All itineraries use normal score ordering; penalties still apply |
| P-10 | Expand a result card | Score breakdown with plain-English penalties |
| P-11 | Open at 375 px width | No horizontal scroll; controls remain usable |
| P-12 | One-way search | Works without a return date |
| P-13 | Results beyond 30 | **Show more** reveals additional already-scored results without a new API call |
| P-14 | Rate limiting | More than 30 searches from one IP in 10 minutes returns a controlled error |

---

## 5. Communication and tracking

| Item | Cadence | Format |
|---|---|---|
| Status update | Weekly | Short written update: done, in progress, blockers |
| Functional demo | End of each phase | Link to the test deployment |
| Blocker escalation | Immediate | Direct contact with the Product Owner |
| Scope changes | As needed | No scope change without prior written agreement |

---

## 6. Closed decisions (do not reopen without agreement)

To avoid repeated discussion during development, the following decisions are considered closed:

1. Scoring is calculated **in the browser/client**, not on the server. All **valid** results are scored client-side.
2. The v1 scoring formula is defined in the functional specification, section 4, and is not adjusted during the MVP.
3. Maximum **2 stops per journey direction** (outbound and inbound evaluated separately).
4. Round-trip scoring uses total price, outbound + inbound duration, and total stops across both directions.
5. Airport-change penalties **stack** with risky-connection penalties when both apply.
6. With **Show tight connections** disabled, non-risky itineraries fill positions 1–5 first; if fewer than five non-risky exist, remaining positions 1–5 are filled by risky itineraries in score order; positions 6 onward contain remaining itineraries in score order; no empty positions when results exist.
7. No user accounts or persistence of personal data in the MVP.
8. The app does not book or charge users; it redirects to the final provider.
9. The application stack is **Next.js + React + TypeScript + Tailwind CSS**, using the App Router.
10. The MVP user interface and repository language are **English**; no i18n system is added.
11. The initial flight-data provider is selected during **F0 provider evaluation** and must remain replaceable through the provider abstraction.
12. Airport autocomplete uses a **local/static dataset** (min. fields: iata, name, city, countryCode, latitude, longitude), not the paid flight provider.
13. Cache access is abstracted in **`lib/cache.ts`**; start with the simplest viable implementation.
14. Cache keys include origin, destination, departure date, return date (literal **`"ONE_WAY"`** when absent), passengers, and cabin class.
15. Request EUR from the provider whenever supported; use provider currency conversion when available; no separate FX service unless the selected provider requires it.
16. **`searchId`** is for internal request tracing only.
17. Display **`operatingCarrier`** as primary; fall back to **`marketingCarrier`** when missing; when both differ, show **`operatingCarrier`**.
18. Layover `connectionType` is `"DOMESTIC" | "SCHENGEN" | "INTERNATIONAL"`; Schengen membership is determined from airport `countryCode` via an explicit country-code set in code.
19. **PWA support is outside the MVP.**
20. **Rate limiting** (30 searches / IP / 10 minutes) is required for MVP delivery and may be implemented during F4.
21. Presets, expandable score breakdown, and **Show tight connections** are **Priority 1** MVP features.
22. Unit tests are required for both **`lib/scoring.ts`** and **`lib/normalize.ts`**.
23. A **valid itinerary** is successfully normalized, scoring-complete, within the 2-stops-per-direction rule, and rankable; risky itineraries remain valid.
