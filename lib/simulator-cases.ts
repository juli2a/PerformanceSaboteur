import type { CaseKey } from "@/types/simulator";

// Mirrors the 4-part tip structure from .claude/skills/content-maker/SKILL.md.
export interface CaseTip {
  problem: string;
  reproduction: string;
  effect: string;
  badCode: string;
  goodCode: string;
  summary: string;
}

// Split title/body so PerformancePanel can render them as a SimulatorAlert card directly: title is the short uppercase label, body the explanation.
export interface CaseAlert {
  title: string;
  body: string;
}

export interface ToggleItem {
  label: string;
  key: CaseKey;
  tip: CaseTip;
  // Override shown on mobile instead of `tip`, only set for a case whose bad/good code (and the story behind why state is shared at all) genuinely differs by platform, not just its trigger (see contextOverhead / Case 7, docs/case7.md "Мобільна версія"). Absent for every other case, which renders the same `tip` on both surfaces.
  mobileTip?: CaseTip;
  alert: CaseAlert;
}

// Shared case definitions for the simulator control panel, consumed by both the desktop ControlPanelTogglers and the mobile MobileControlDrawer. `key` matches `CaseKey` exactly so both can read/write `useSimControlStore` without a separate name-mapping table. `tip`/`alert` are filled in by the content-maker skill (.claude/skills/content-maker/SKILL.md).
export const SIMULATOR_CASES: { title: string; items: ToggleItem[] }[] = [
  {
    title: "Network",
    items: [
      {
        label: "Request waterfall", //case 5
        key: "waterfall",
        tip: {
          problem:
            "The dashboard's data requests are awaited one after another instead of at the same time, so their delays stack up instead of overlapping. This pushes DOMContentLoaded back significantly, and LCP suffers as a result, since nothing can render until the last request finishes.",
          reproduction:
            "Go to the Dashboard. Switch this toggle on. The page reloads so the server can refetch sequentially.",
          effect:
            "The dashboard stays blank for several seconds, then the whole layout snaps in at once instead of streaming in section by section. LCP spikes in the Performance Panel, since nothing can render until the last request finishes.",
          badCode:
            "Each request is awaited before the next one starts, so the server can't send even its first byte until all independent requests have finished one by one.",
          goodCode:
            "Each dashboard section fetches its own data inside its own Suspense boundary, so all requests fire the moment the server starts rendering instead of waiting on each other.",
          summary:
            "Independent data requests should never block each other behind sequential awaits: run them concurrently (Promise.all, parallel Suspense boundaries) so total latency tracks the slowest request, not the sum of all of them.",
        },
        alert: {
          title: "",
          body: "",
        },
      },
      {
        label: "Search race condition", //case 4
        key: "raceCondition",
        tip: {
          problem:
            "Each keystroke fires its own search request, and a slower response for an earlier, shorter query can arrive after a faster response for what you actually typed. This overwrites the table with stale data, so the search box and table are out of sync.",
          reproduction:
            'Go to the Inventory Control. Switch this toggle on and type a product name into the Inventory search box quickly, e.g. "lip" - as part of "lipstick".',
          effect:
            'The search box shows "lip", but the table still shows results for "l" or "li". The panel raises a race-condition alert until a fresh response corrects it.',
          badCode:
            "Fires a fetch on every keystroke with no debounce and no cancellation, so whichever response resolves last wins, not whichever request was sent last.",
          goodCode:
            "Debounces the input 300ms and cancels the previous request with an AbortController on every keystroke, so only the response for the final query ever gets applied.",
          summary:
            "Debounce and cancel requests triggered by fast-changing input: never trust that responses arrive in the same order they were sent.",
        },
        alert: {
          title: "Race Condition",
          body: "Stale response overwrote a newer search result.",
        },
      },
    ],
  },
  {
    title: "Rendering",
    items: [
      {
        label: "Layout shift", //case 2
        key: "layoutShift",
        tip: {
          problem:
            "The sidebar's collapsed/expanded preference is saved to localStorage only, so the server has no way to know it and always renders the sidebar expanded. The client should correct it right after the page loads every time, but that shift is counted as a CLS tick in the Performance Panel.",
          reproduction:
            "Collapse the sidebar with the arrow button above the nav icons, then turn this toggle on. The page reloads so the server can re-render with the change.",
          effect:
            "The sidebar and the logo next to it briefly render expanded, then animate to collapsed a moment after the page finishes loading. CLS ticks up in the Performance Panel even though the shift itself looks smooth.",
          badCode:
            "Persists the collapsed flag with zustand's persist middleware (localStorage only), so the very first server-rendered HTML always shows the sidebar expanded, whatever the user last picked.",
          goodCode:
            "Mirrors the same flag into a cookie the server can read, so the Server Component renders the sidebar at its real width from the first paint. Nothing to correct after the client mounts.",
          summary:
            "Any UI preference that changes layout (a collapsed sidebar, a dismissed banner, a saved column width) needs to be readable server-side (a cookie, not just localStorage), or it will shift into place after every load.",
        },
        mobileTip: {
          problem:
            "The bottom Performance Panel's expanded/collapsed state is saved to localStorage only, so the server has no way to know it and always renders the panel collapsed. The client should correct it right after the page loads every time, but that shift is counted as a CLS tick in the Performance Panel.",
          reproduction:
            "Expand the Performance Panel (on the bottom of the screen) by tapping it, then turn this toggle on. The page reloads so the server can re-render with the change.",
          effect:
            "The panel briefly renders collapsed, then snaps open to its real height a moment after the page finishes loading. CLS ticks up in the Performance Panel even though the shift itself looks smooth.",
          badCode:
            "Persists the expanded flag with zustand's persist middleware (localStorage only), so the very first server-rendered HTML always shows the panel collapsed, whatever the user last picked.",
          goodCode:
            "Mirrors the same flag into a cookie the server can read, so the panel renders at its real height from the first paint. Nothing to correct after the client mounts.",
          summary:
            "Any UI preference that changes layout (a collapsed sidebar, an expanded panel, a dismissed banner) needs to be readable server-side (a cookie, not just localStorage), or it will shift into place after every load.",
        },
        alert: { title: "", body: "" },
      },
      {
        label: "Unoptimized Images", //case 1
        key: "imageOptimization",
        tip: {
          problem:
            "Every slide in the hero banner skips Next.js's image optimization entirely, so each one loads the original, unresized image, with no CDN caching and no format conversion to WebP. The first slide, the page's actual LCP element, also loses its priority hint, so it competes with the offscreen slides for bandwidth instead of loading first.",
          reproduction:
            "Go to the Dashboard, then switch the toggle on and off a few times and wait for the page to reload. Compare the LCP reading between the two states.",
          effect:
            "With the toggle on, LCP is noticeably higher because the banner image loads through an unoptimized path (our sample images are already small and already WebP, so we added an artificial loading delay to stand in for a real, uncompressed origin).",
          badCode:
            "Renders every slide as a plain <img> with no priority or lazy-loading hint, so the first slide (the one that's actually the LCP element) loads no faster than the hidden ones.",
          goodCode:
            "Renders every slide with next/image; the first slide gets priority (an eager, high fetch-priority load, since it's the LCP element) while the rest lazy-load by default.",
          summary:
            "Always optimize image size and format: reach for what your framework already offers (like next/image) and give whichever image is the real LCP candidate a priority hint. Don't treat it like any other offscreen image.",
        },
        alert: { title: "", body: "" },
      },
      {
        label: "Hydration mismatch", //case 6
        key: "hydrationMismatch",
        tip: {
          problem:
            'The dashboard\'s "Updated" time is computed live, directly during render. During hydration, the client recalculates it in your local timezone while the server rendered it in UTC, so the two values disagree and React throws a hydration error.',
          reproduction:
            "Go to the Dashboard. Switch this toggle on. The page reloads so the server renders the timestamp fresh.",
          effect:
            'The "Updated" time first shows the server\'s UTC reading, then immediately snaps to your local time once React notices the mismatch. The browser console throws a hydration-failed error, and the Performance Panel raises a Hydration Mismatch alert.',
          badCode:
            "Calls new Date().toLocaleTimeString() straight in the render body, so the server computes one clock reading and the client immediately computes a different one in its place.",
          goodCode:
            "Renders the same fixed placeholder text on the server and on the browser's very first render, then swaps in the real, browser-only timestamp right after, so the server and client never actually disagree on what to show.",
          summary:
            "If a value can come out differently on the server than in the browser (the time, the locale, anything based on window), don't render it on the very first pass. Show a placeholder first, then swap in the real value once you know you're running on the client.",
        },
        alert: {
          title: "Hydration Mismatch",
          body: "Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client.",
        },
      },
      {
        label: "Context re-render storm", //case 7
        key: "contextOverhead",
        tip: {
          problem:
            "Which rows are selected needs to be shared between two places at once, each row's own checkbox and the Bulk Actions bar in the toolbar above the table, so it can't just live as local state inside a single row. If that shared state lives in a React Context instead of a per-row store selector, every row component subscribes to the same Context, so any update to it re-renders every row, not just the one whose selection changed.",
          reproduction:
            " Go to the Inventory Control. Switch this toggle on, then click a checkbox in the Inventory Control table.",
          effect:
            "Every visible row's Flash on Update outline fires at once, not just the one you clicked, and the Performance Panel raises a Context Re-render Storm alert naming how many rows re-rendered. Blocking Time and Interaction Latency both tick up too, since re-rendering every visible row for one click is excess main-thread work.",
          badCode:
            "Every row reads the same Context value; toggling one checkbox builds a brand-new context object, which forces every row consuming it to re-render, not just the one whose checkbox changed.",
          goodCode:
            "Each row subscribes to a Zustand selector scoped to just its own id, so only the row whose selection actually changed gets notified and re-renders. Bulk Actions and Select All read the very same store, just via their own selectors.",
          summary:
            "Shared Context re-renders every consumer on any change, no matter how small. Many components can genuinely need to read the same state, but each one usually only cares about its own slice of it: a row, an id, a field. For that, use a store with per-item selectors instead.",
        },
        mobileTip: {
          problem:
            "The product card list in Inventory has a Change status feature. But because this demo's backend (DummyJSON) doesn't actually save status changes to a database, the app has to keep that change in its own client-side memory instead. If they are stored in a React Context instead of a per-row store selector, every card component then subscribes to that same Context, so any update to it re-renders every card, not just the one whose status changed.",
          reproduction:
            'Go to the Inventory Control. Switch this toggle on and tap "Change" on a product card and confirm a new status.',
          effect:
            "Every visible card's Flash on Update outline fires at once, not just the one you changed, and the Performance Panel raises a Context Re-render Storm alert naming how many cards re-rendered. Blocking Time and Interaction Latency both tick up too, since re-rendering every visible row for one click is excess main-thread work.",
          badCode:
            "Every card reads the same Context value; changing one product's status builds a brand-new context object, which forces every card consuming it to re-render, not just the one whose status changed.",
          goodCode:
            "Each card subscribes to a Zustand selector scoped to just its own product id, so only the card whose status actually changed gets notified and re-renders.",
          summary:
            "Shared Context re-renders every consumer on any change, no matter how small. Many components can genuinely need to read the same state, but each one usually only cares about its own slice of it: a row, an id, a field. For that, use a store with per-item selectors instead.",
        },
        alert: {
          title: "Context Re-render Storm",
          // Static prefix only, the live count comes from the FlashOnUpdate settle-window counter (see docs/case7.md) and is appended at render time, e.g. `${body}: ${count}`.
          body: "Rerendered Nodes on Action",
        },
      },
    ],
  },
  {
    title: "Computing",
    items: [
      {
        label: "Heavy mounting", //case 3
        key: "heavyMounting",
        tip: {
          problem:
            "The Inventory table renders every one of its 2000+ rows into real DOM at once, not just the up to 10 rows that actually fit on screen, so mounting the page costs as much as the whole dataset. Since React can't show the new page until all of that DOM is built, the user is left waiting, both for the page transition itself and for any other action they try in the meantime.",
          reproduction:
            "Go to the Dashboard. Switch this toggle on, then click Inventory Control in the menu and keep clicking around (e.g. the hero slider's arrow) while page loads.",
          effect:
            "The old page stays put for several seconds; the first couple of clicks still land, then the app stops responding to anything until Inventory Control finally appears. The Performance Panel shows DOM Nodes past 30,000 and INP spiking into the thousands of milliseconds. On mobile or a slower machine, Blocking Time spikes too, since there's less spare CPU for React to squeeze work between frames.",
          badCode:
            "Maps the full, unfiltered row list straight into JSX with no limit on how many mount at once, so React has to build and commit 2000+ real row subtrees for a table that only ever shows up to 10 of them.",
          goodCode:
            "Hands that same row list to @tanstack/react-virtual's useVirtualizer, which keeps only the rows near the current scroll position mounted and swaps which ones those are as you scroll, instead of growing the mounted count.",
          summary:
            "Every mounted row is real work (build it, lay it out, paint it), and the browser can't paint the result of a click (or show the next page) until that backlog clears, so INP and the stalled transition are really the same cost showing up twice; any list that can outgrow the screen (rows, chat messages, feed items) needs windowing or pagination before that growth becomes the user's problem.",
        },
        alert: { title: "", body: "" },
      },
      {
        label: "Broken memoization", //case 8
        key: "brokenMemoization",
        tip: {
          problem:
            "A component wrapped in React.memo still re-renders every time if the props it receives are rebuilt from scratch on every render. The memo check runs, fails, and gains nothing.",
          reproduction:
            'Go to the Analytics Grid on the Dashboard. Switch this toggle on and drag the "Min GM%" slider back and forth.',
          effect:
            "All 100 cards flash on every tick, and INP and Blocking Time can both go up. Each tick re-renders the whole grid and reruns every card's sparkline calculation, which is even more noticeable on mobile or a slower machine. The Performance Panel raises a Memo Overhead alert while you drag, naming how many cards re-rendered.",
          badCode:
            "Each card gets a freshly spread `{ ...product }` object and the slider's raw `threshold` number as props, so React.memo's comparison never matches for either. On top of that, the card also calls the expensive function that computes its sparkline data on every one of those re-renders, a separate mistake, since that calculation only depends on the product list, not the slider, so it belongs at the grid level, not inside each card.",
          goodCode:
            "Each card receives only the primitive fields it needs, including a derived `lowMargin` flag instead of the raw `threshold`, so React.memo's comparison actually succeeds and skips re-rendering cards whose visual state hasn't changed. The sparkline data itself is computed once for the whole grid, not per card, since it only depends on the product list, the slider never touches it.",
          summary:
            "Two separate lessons here. First, memo only pays off if you take care of both sides of it: wrapping the component in memo is not enough on its own, the props reaching it need to stay stable across renders too, whether that's an object rebuilt fresh each time or a raw shared value, like the slider's threshold, passed straight through instead of a derived, per-card result. Second, an expensive calculation belongs wherever its real input lives, this one only depends on the product list, not the slider, so it should run once for the whole grid, not inside each card on every re-render, memoized or not.",
        },
        alert: {
          title: "Memo Overhead",
          // Static prefix only, the live count comes from the FlashOnUpdate settle-window counter (see hooks/useRerenderNodesReporter.ts) and is appended at render time, e.g. `${body}: ${count}`.
          body: "Rerendered Nodes on Action",
        },
      },
    ],
  },
];

// Looks up a single case's definition by key, plus the zone (Network / Rendering / Computing) it belongs to, e.g. so PerformancePanel can show a case's authored `alert` text, and the right-hand guide panel can show its zone as a subtitle, without scanning SIMULATOR_CASES twice.
export function getSimulatorCase(
  key: CaseKey,
): ToggleItem & { zoneTitle: string } {
  for (const zone of SIMULATOR_CASES) {
    const item = zone.items.find((candidate) => candidate.key === key);
    if (item) return { ...item, zoneTitle: zone.title };
  }
  throw new Error(`Unknown simulator case: ${key}`);
}
