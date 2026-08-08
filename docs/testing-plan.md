# Plan: test coverage for PerfSaboteur

## Context

The product is done, the docs (`docs/*.md`, the tip objects in `lib/simulator-cases.ts`) are already aligned with the code. There are currently no tests in the project at all — no test framework in `package.json`, not a single `*.test.ts` file. Goal: don't cover everything indiscriminately, cover the places with real, non-trivial logic — and do it so the tests check **documented behavior**, not accidentally pin down a bug that's already sitting in the code.

---

## Part 1 — how not to "test in" a bug

The problem is real: if you look at the implementation and immediately write `expect(fn(x)).toBe(<whatever the function currently returns>)`, the test becomes a mirror of the code, not a check of correctness. It's always green and catches nothing. The approach that counters this:

1. **An independent source of truth first, not the implementation.** This project already has one, which is rare for a pet project:
   - `docs/data.md` — exact formulas (`LTV = id*1250 + age*300`, `avgCheck = revenue/orders`, `logisticStatus` rules, the `deriveRealProductId` formula);
   - `docs/case1.md … case8.md` + the `problem/effect/badCode/goodCode/summary` fields in `lib/simulator-cases.ts` — a verbal description of exactly what should happen on the "bad" and "good" path of each anti-pattern.
   - This is written declaratively, before I ever look at the function body. So I formulate expectations **from the document**, not from the code.

2. **Order of operations for each test:**
   a. Read the description in docs / tip → put the expected behavior into my own words;
   b. Write the assertion based on that description;
   c. Only now open the implementation — and cross-check. If the code matches — good, the test stays. If the code does **not** match the description, I don't quietly bend the test to fit the code. Instead I raise it as a separate item: "mismatch with the spec in X" — and we decide together whether it's a bug or the documentation is stale.
   d. For purely structural things (an export's name, a function's signature), cross-checking against the code is fine — that's not "logic," that's the contract the test has to agree with anyway.

3. **Where the docs are silent and the logic is subtle** (e.g. `merge`/`partialize` in `store/simulator-control.ts`) — the source of truth then becomes the "why" comments in the code itself (they explain intent, not just describe what the line does). The test is written against the **invariant** formulated from that intent ("cookie cases are always taken from the cookie-seeded state, never from the localStorage blob"), not against whatever specific number the code currently returns.

4. Every new test suite I run right away and show you the real result (green/red), instead of just saying "done."

5. **This document is a map, not a case-by-case list.** Part 3 below describes *what* and *why* is interesting to test for each function/hook/component, but doesn't enumerate every concrete `it(...)` up front. The exact list of test cases (with concrete input/output values) I formulate right before writing tests for a specific file — I show it to you as a short checklist, and only after that do I write the code.

---

## Part 2 — which kinds of tests, and why each one

The canonical trio — **Unit / Integration / E2E**. The split criterion isn't "which folder or module," it's how many real (non-mocked) collaborators are involved:

- **Unit** — one isolated unit of logic. No real React, no network, no browser APIs.
- **Integration** — several real parts working TOGETHER, and the test checks exactly the seam between them.
- **E2E** — through the real application end-to-end, like a user.

Per the modern frontend-testing canon (Testing Trophy, Kent C. Dodds), the Integration layer is the one that earns the most confidence — "the more your tests resemble the way your software is used, the more confidence they can give you" — so in this project it's not a secondary layer, it's the main one.

| Level | Tool | What it checks | Why here |
|---|---|---|---|
| **Unit** | Vitest | pure functions (`derive.ts` etc.) **+** the whole Zustand-store layer, including `merge`/`partialize` | cheapest, most stable, catches mistakes in formulas and in state logic |
| **Integration — Hooks** | Vitest + `@testing-library/react` (`renderHook`) | custom hooks: `renderHook` mounts real React, and the hooks coordinate React + store + browser API (cookie, location) or the network — a seam between several real parts | this is where the race-condition mechanics and SSR-cookie sync live |
| **Integration — Component** | Vitest + RTL + `msw` | component ⇄ store ⇄ network interaction, a thicker slice of the same layer | checking "case turned on → the right effect is visible" |
| **E2E** | Playwright | a real browser, a real Next.js dev/build server | the only honest way to check the SSR cases (cookie → reload → different HTML) and what a live user actually sees |

**A store is always Unit, no exceptions.** A Zustand store on its own is an isolated stateful object; `getState()/setState()` touch neither React, nor the network, nor the DOM. That includes `merge`/`partialize` in `simulator-control.ts`: no need to refactor the code or run the store through real localStorage — the Zustand `persist` middleware exposes these functions itself via `store.persist.getOptions()`. In the test we call `useSimControlStore.persist.getOptions().merge(persistedBlob, currentState)` directly, like an ordinary pure function — no touch of localStorage at all, so it stays Unit.

**Deliberately out of scope:** exact CWV numbers (LCP/CLS/INP) in e2e — they're unstable in CI and don't check any branch of logic; presentational wrappers in `components/ui/`; the contents of `design/` (those are mockups, not app code); visual regression testing (screenshot diffing) — a separate topic, not now.

---

## Part 3 — concrete candidates (not exhaustive, just the interesting ones)

### Unit — pure functions
- **`lib/utils/derive.ts`**: `deriveTrend` (edge case: all values equal → `false`, falls back to the previous segment if the last one is "flat"); `deriveLtv` (formula from `docs/data.md`, not from the code); `deriveHalfWindowDeltaPercent` (the `older === 0` branch); `deriveKpiTrend` (the documented guarantee "always ≥2%", despite ±4% wobble — exactly the case where random noise could break the guarantee if the floor were removed).
- **`lib/server/dal/inventory.ts`**: `deriveRealProductId` as the exact inverse of the id-amplification formula (`((id-1) % 100) + 1`) — a round-trip test across all 20 batches; the `logisticStatus` rules (stock ≤3 / ≤10 / otherwise — by shipping) — tabulated from `docs/data.md`.
- **`lib/server/dal/dashboard.ts`**: "top-5 by LTV" sorting (not just the first 5 in API order), revenue/avgCheck aggregation.
- Selectively `lib/utils/gauge.ts`, `sparkline-processing.ts` — wherever there's branching, not a trivial formatter.
- **`lib/utils/peak-hold-queue.ts` — `createPeakHoldQueue`** (missed in step 2d, found during the audit): a private FIFO queue with a single-value hold timer — once a "bad" (`degraded`/`poor`) value is shown, it stays on screen for at least `PEAK_HOLD_MS` (1000ms) before the next queued value replaces it; "good" values apply immediately (`delay = 0`); no value is ever dropped. State + timer + a queue with branching on the value's rating (`getValueRating`) — exactly the kind of logic this part of the plan is deliberately looking for. (Discussed together with two other `gauge.ts` exports — rejected as a result of that discussion.)
- **`components/dashboard/DashboardContentUnoptimized.tsx`** (Case 5, waterfall) — `components/dashboard/DashboardContentUnoptimized.test.tsx`: the component itself isn't a pure function but an `async` function that sequentially awaits four requests (`getCarts` → `getProducts` → `getUsers` → `getCategories`), and it's exactly this sequencing (not concurrency) that's the essence of Case 5's "bad" path. This can't be proven at the DOM/browser level: the component is nowhere wrapped in `<Suspense>`, so React returns the whole JSX in one piece regardless of whether the requests inside are awaited one by one or concurrently via `Promise.all` — confirmed in practice, both variants give the same result in the browser (one flash, no fallback). The test mocks all four functions (`vi.mock("@/lib/server/dal/dashboard")`) and checks call order not via an external array, but via flags inside the mocks themselves: each mock sets its own flag only after its own `await Promise.resolve()` (to guarantee a real async gap between "called" and "resolved"), and the next mock checks the previous one's flag before it starts. If the code is swapped for `Promise.all([...])`, all four mock calls start synchronously, nearly at once — and the check in the second mock fails immediately, because at that point the first mock's flag hasn't been set yet (verified — temporarily swapping in `Promise.all` fails the test exactly there). At the end — `toHaveBeenCalledTimes(1)` for all four functions, so the test also catches a different kind of regression: if one of the requests gets removed from the code entirely, its mock simply never runs, and without this check that omission would slip by unnoticed.

### Unit — Zustand stores
- **`store/simulator-control.ts`** — the most interesting spot in the project: `partialize` excludes `SSR_COOKIE_CASES` from the localStorage blob, `merge` takes those keys from the cookie-seeded state, not from the persisted one. The test calls `useSimControlStore.persist.getOptions().merge(persistedBlob, currentState)` directly (no real localStorage involved): if the persisted blob contains `waterfall: true` while the current (cookie-seeded) state has `waterfall: false`, the merge result must keep `false` (from the cookie), not `true` (from localStorage) — and vice versa for non-cookie cases. This is exactly the kind of logic that's easy to get wrong during a refactor and where the bug isn't visible to the naked eye.
- `triggerAlert`/`dismissAlert`/`closeAlert` — the idempotency invariant (calling `triggerAlert` twice doesn't change an already-`"shown"` alert), `closeAlert` removes the key entirely rather than setting `"dismissed"`.
- **`store/render-counter.ts`**: `startTracking` always resets the counter, `startTrackingIfIdle` only resets when not currently tracking (lets a series of actions accumulate into one "burst"), `increment` is ignored if `!isTracking`.

### Integration — Hooks
- **`hooks/useInventorySearch.ts`** — the heart of Case 4 (race condition). Via `msw` + `vi.useFakeTimers()`: bad path — whichever response arrives last in time overwrites the state, even if it belongs to an older request (reproducing the example from `docs/case4.md`: a short query resolves slower and still "wins"); good path — `AbortController` guarantees a stale response never reaches `setMatchedIds`.
- **`hooks/useToggleCase.ts`** — for `SSR_COOKIE_CASES` it sets `document.cookie` and calls `window.location.reload()`, for other cases it doesn't.
- **`hooks/useSyncSsrCookies.ts`** — syncs the store with the cookie **only** if the values have diverged; a test for "doesn't call `setToggle` redundantly when already in sync" (a redundant call = a redundant re-render, and the whole product is about exactly that).
- **`hooks/useClearAlertsOnNavigate.ts`** — clears alerts on `pathname` change, but **not** on the effect's very first run. The reason for this exception is documented directly in a code comment: an SSR case (e.g. Case 6, Hydration Mismatch) can trigger its own alert synchronously during this same page's hydration, before this effect has even had a chance to run for the first time — if the clearing happened unconditionally on every run, it would wipe out an alert that was just shown instead of letting it stay visible. Test: render the hook with some `pathname`, set an alert directly via the store, change `pathname` (via a re-render with a new value from `usePathname`) — the alert should disappear only on this second change, not right after the hook's initial mount.
- **`hooks/useResetAllToggles.ts`** — a guarantee documented in a comment: "All off" calls `window.location.reload()` at most once per invocation, not once per active `SSR_COOKIE_CASES` case. Test: turn on several SSR cases at once, call the returned function, count the calls on the mocked `window.location.reload` — should be exactly one (not zero, not several), and exactly zero if none of the active cases belonged to `SSR_COOKIE_CASES`.
- **`hooks/useRerenderNodesReporter.ts`** — a 100ms timer (`SETTLE_DELAY_MS`) that restarts on every new `increment` in the `render-counter` store while a "burst" of renders is ongoing; only once the series has settled does it publish the final count to the `simulator-performance` store and decide whether to call `triggerAlert` or `closeAlert`, based on whether the count exceeded `alertThreshold`. Via `renderHook` + `vi.useFakeTimers()`: check that several `increment` calls in a row do **not** publish intermediate values (the timer resets each time), and that the boundary count (exactly `alertThreshold` vs. `alertThreshold + 1`) drives different branches (`closeAlert` vs. `triggerAlert`).
- **`hooks/useSyncControlsAcrossBreakpoint.ts`** — when `isMobile` transitions from `false` to `true`, it forcibly opens the mobile case panel, but only if there's an active `activeGuideKey`; on the transition back to desktop it always closes it. Protected against redundant firing via `wasMobileRef` (reacts only to an actual breakpoint change, not to every render) and against an undefined `isMobile` (the SSR "don't know yet" state). Test: change the value returned by the mocked `useContext(MediaContext)` between renders of the hook and check the calls (or non-calls) to `setControlsOpen` for each of the three branches — mobile-with-a-guide, mobile-without-a-guide, back-to-desktop.
- **`hooks/usePanelExpanded.ts`** and **`hooks/useSidebarCollapsed.ts`** — Case 2 (layout shift) mechanics at the hook level, not only in E2E. Both hooks write **to both** stores on every click (the stable cookie-backed one and the unstable localStorage-only one) regardless of which store is currently driving the display — a documented intent: flipping the Case 2 toggle shouldn't lose the user's current state. `usePanelExpanded` additionally has an artificial `setTimeout(..., 150)` delay on the "bad" path — a reproduction of a real bug (someone forcibly suppressed a visual glitch with a guessed delay instead of finding the cause). Until now the only coverage of Case 2 in the whole plan was a single E2E scenario that checks only the initial SSR HTML (Part 3, E2E, below); no test level checked either the double write or the hook's behavior after hydration. Test: click `setExpanded`/`setCollapsed` — check that both stores (via `getState()`) received the new value and that the cookie was set; separately for `usePanelExpanded` — that the value the hook returns in "unstable" mode only appears after the timer has run (`vi.advanceTimersByTime`), not immediately.

### Integration — Component
(An audit before starting step 5 — the same process as for the hooks in step 4 — showed that the original list here mentioned only two of five real candidates. Case 1 and Case 3 hadn't appeared in any section of this plan at all before, even though both have a clear bad/good branch in the code from `lib/simulator-cases.ts` that's only visible in a real DOM render — i.e. not caught by a pure function (Unit) and not requiring a browser or network (i.e. not necessarily E2E).)

- **Case 1 (unoptimized images)**: `TopProductsBannerClient` takes `isUnoptimized` as a direct prop, without reading a cookie or a real server component — render it with `true` and `false` and check the DOM: on the bad path it's a raw `<img>` with no priority hints at all, on the good path it's `next/image` with `fetchPriority="high"` and `loading="eager"`, and specifically on the first slide, not the rest (`components/dashboard/TopProductsBannerClient.tsx`).
- **Case 3 (heavy mounting)**: `ProductTable` removes the row limit entirely (`flatRowLimit = rows.length`) when this toggle is on. The test counts the actually-mounted rows in the DOM in three states: all toggles off — virtualization, only the visible slice is mounted (~15-20 rows); Case 7 on — a flat list capped at `FLAT_ROW_LIMIT` (200); Case 3 on — no cap, every row (`components/inventory/ProductTable.tsx`).
- **Case 7 (Context storm) vs. Zustand selector**: render the table rows, click one checkbox, check via `render-counter` — with the case off, only one row re-rendered; with it on (simulated via Context), every visible row did.
- **Case 8 (broken memoization)**: similarly — only one card re-renders when its underlying product changes, when the toggle is off.
- **ControlPanelTogglers**: click a toggle → `store.toggles` updates → for `SSR_COOKIE_CASES` a (mocked) reload is called, for the rest it isn't.

### Integration — Component (5.2, Inventory admin — outside the cases)
Not tied to any toggle from `lib/simulator-cases.ts` — ordinary admin functionality that also has non-trivial logic. Found during the "did we cover everything" audit after step 5.

- **Case 7's mobile branch** (`ProductCard` vs. `ProductCardUnoptimized`, `context/RowStatusContext.tsx`) — a separate scenario of the case (`mobileTip`) missed by step 5, which only tested the desktop (checkbox/`TableSelectionContext`) branch.
- **`StatusChangeDrawer`** — its own correctness (PATCH → `onChangeStatus`), not about Case 7.
- **`BulkActions`** — `noopChange` (the confirm button is disabled if every selected item already has the target status) + the full flow PATCH → optimistic overlay → `clearSelection()`.
- **`SelectAllCheckbox`** — "all" vs. "some" of the visible products selected + that the action only operates on the visible ones (not the whole selection).
- **The category-filter effect on `ProductTable`** — whether selecting a category in `useInventoryFiltersStore` actually narrows the visible rows (the filter checkbox UI itself is a thin wrapper with no branching and is deliberately not tested).

### E2E (Playwright)
Literally reproducing the "Reproduction" steps from `docs/caseN.md`:
- Case 5 (waterfall), `e2e/case5-waterfall.spec.ts`: `page.route` from the original plan didn't work — all 4 requests run server-side, inside the Server Component, and the browser never sees them at all (Playwright's `page.route` only intercepts requests the browser itself makes). Replaced with a structural check for the presence/absence of Suspense fallbacks instead of timing measurements: `off` — a single direct HTTP request with no browser (`context.request`, the same cookie jar as `context`) to `/dashboard` with the `waterfall=off` cookie, checking the raw response text for `data-skeleton="<section>"` on every section except the banner, and for `data-section="<section>"` on all five sections. The banner is excluded from the must-show-fallback list in both tests: its promise sometimes manages to resolve before the server serializes the initial shell, and then the fallback never makes it into the response at all — this is a decision React makes once, synchronously, on the server, so switching from the browser to a direct HTTP request doesn't remove that instability (it only removes a separate, purely browser-side class of instability — navigation races). `on` — likewise a direct HTTP request with the `waterfall=on` cookie, checking that `data-skeleton="..."` never appears in the HTML for any section at all (a structural proof of no Suspense: with no `<Suspense>` boundary the server has nothing to hold back and no fallback to substitute, so those bytes physically cannot end up in the response), plus a separate, browser-based test — all 5 content sections should become visible at one and the same moment; raw HTML can't prove that simultaneity (it doesn't show when the browser actually painted something), so this is the only part that still opens the page.
- Case 2 (layout shift): toggle + cookie → the first SSR HTML contains the expected initial sidebar state.
- Case 6 (hydration mismatch): a console hydration error appears only when the toggle is on.
- Case 4 (race condition): real input into the search field — the table eventually shows the correct result; the intermediate incorrect state is observable only when the case is on.

---

## Part 4 — tooling that needs to be added

None of this is in `package.json` yet:
- `vitest` + `@vitejs/plugin-react` + `jsdom` — unit/store/hook/component level; chosen over Jest because it's ESM-native and faster on a Vite-like config, and plays well with Next.js 16 App Router.
- `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` — component tests.
- `msw` — intercepting `fetch` calls to DummyJSON in integration tests: without it, tests either hit the real API (unstable, slow) or every test manually mocks `global.fetch` (brittle).
- `@playwright/test` — e2e, a real browser.
- Scripts in `package.json`: `test`, `test:watch`, `test:e2e`, `test:coverage` (a coverage report as a guideline, not as a 100% gate).

---

## Part 5 — order of execution

Moving in chunks, each one a separate step with an explanation and a real test run before moving on:

1. **Setup**: `vitest` + RTL + `msw`, base config (the `@/*` alias, jsdom environment, a setup file for `jest-dom`). Not touching Playwright yet — its config is separate and isn't needed for the first steps.
2. **Unit — pure functions**: `lib/utils/derive.ts` + `lib/server` (`logisticStatus`, `deriveRealProductId`, top-5-by-LTV) — the safest place to start, demonstrating the "spec → test → cross-check with code" pattern itself.
3. **Unit — Zustand stores**: `simulator-control.ts` (merge/partialize via `persist.getOptions()`) + `render-counter.ts` — here I'll walk through in detail how to test a Zustand store without rendering a React tree and without real localStorage.
4. **Integration — Hooks**: `useSyncSsrCookies`, `useToggleCase`, `useInventorySearch` (with `msw` + `vi.useFakeTimers()`), `useClearAlertsOnNavigate`, `useResetAllToggles`, `useRerenderNodesReporter`, `useSyncControlsAcrossBreakpoint`, `usePanelExpanded`, `useSidebarCollapsed` — the harder of the two Integration levels, because time and side effects are involved.
5. **Integration — Component**: Case 1 (banner image markup — raw `<img>` vs. `next/image` with priority), Case 3 (actually-mounted table row count), Case 7 / Case 8 (re-render counts), `ControlPanelTogglers` (toggle click → store → reload for SSR cases).
5.2. **Integration — Component, Inventory admin**: Case 7's mobile branch, `StatusChangeDrawer`, `BulkActions`, `SelectAllCheckbox`, the category-filter effect on `ProductTable`.
6. **E2E**: a separate Playwright setup + 3–5 scenarios for the network/SSR cases (5, 2, 6, 4), where Unit/Integration isn't enough for an honest check.

After each step — a short summary: what's covered, why exactly that way, what trade-offs were made (e.g. why `msw` instead of the real DummyJSON; why `renderHook` instead of rendering the full tree).

## Verification
- Each suite is actually run (`pnpm test`) and shows a real green/red status.
- Discrepancies between the documentation and the code, if found, are recorded as a separate list and discussed with you, not quietly "fixed" in the test.
