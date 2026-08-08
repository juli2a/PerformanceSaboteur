# Case 8: Broken Memoization & Computational Overhead

**Category:** Computing / State Management
**Toggle:** Computing → Broken memoization
**Metric:** INP, Blocking Time

## Summary
`React.memo` on its own isn't the problem. There are two independent mistakes here that are easy to mistake for one:

1. A component is wrapped in `memo`, but that alone is not enough: every prop reaching it also has to stay reference-stable across renders. That can break in more than one way, an object rebuilt fresh every time (a spread copy of the product), or a raw, frequently-changing value handed straight through instead of a derived, per-card result (the slider's `threshold`, instead of a `lowMargin` flag). Either one alone is enough to fail the prop comparison, so React fully re-renders the component anyway, overhead with no benefit at all.
2. Separately and independently, an expensive function that computes sparkline data is called **inside the card**, even though its only real dependency (the product's `rawHistory`) has nothing to do with why the card re-renders in the first place (the slider's `threshold`). Even a perfectly memoized `card` wouldn't save you from this, the computation simply lives in the wrong place relative to its dependency.

The good variant fixes both: props are genuinely stable (memo actually skips the re-render) **and** the sparkline is computed once for the whole grid, not inside each card.

---

## Content involved

- **Page:** Dashboard — "Analytics Grid" section (KPI Micro-cards Grid).
- **"Min GM%" slider** (0-40): a horizontal Slider above the card grid. Every move changes `threshold` in the parent component.
- **100 KPI micro-cards** (a grid of 1-5 columns depending on screen width), each containing:
  - The product title (truncated) and a `GM% {marginality}` badge
  - A financial value (`currentValue`, formatted as currency) + a star rating
  - A sparkline (7 points, a `recharts`-based `Sparkline` component)
- **Clicking a card** opens a Popover with the full product title, SKU, and a copy-SKU button (instead of the earlier hover-on-title — the entire clickable trigger is now the card itself, not just the title text).
- **Visual re-render indication:** every card is wrapped in `FlashOnUpdate` (the same mechanism as Case 7) — briefly flashes red each time it actually re-renders.
- **Threshold visual effect:** cards with `marginality < threshold` → `opacity-40` + a gray border; the rest get an accented border.

---

## Data (identical for both variants)

**Request:** `GET /products?limit=100` (no `select` — all fields are fetched, the needed ones are picked locally).

**Transformation:** 100 products → 100 cards (1:1), `lib/server/dal/dashboard.ts`'s `getProducts()`.

**Card structure (`types/analytics.ts`):**
```ts
interface AnalyticCardData {
  id: string;
  meta: { title: string; sku: string };
  metrics: {
    currentValue: number; // price × stock
    rating: number;
  };
  marginality: number;   // = Math.round(product.discountPercentage)
  rawHistory: number[];  // 365 "raw" daily values for the year
}
```

**Sparkline pipeline (client-side, `lib/utils/sparkline-processing.ts`):**
- `rawHistory` (`lib/utils/derive.ts`'s `deriveRawHistory`) — 365 daily values: a base oscillation of exactly **1 full cycle across the whole year** (a deterministic sine, phase depending on `productId`) + a deterministic one-off spike (+60% of the base price) every 14 days, as an artificial "outlier" for testing outlier cleanup.
  - *Fixed this session:* the oscillation frequency used to be ~1 cycle per 37 days, which conflicted with the ~52-day downsampling buckets below and caused aliasing — the sparkline's final 7 points looked like a sharp zigzag between two levels instead of a smooth trend.
- `processSparklineHistory(rawHistory)` — `removeOutliersIterative` (an iterative IQR trim, up to 5 passes) → `movingAverage(7)` (smoothing) → `downsampleTo(7)` (downsampling to the final 7 points). This is the same "expensive function" the case is about.

---

## Good code (Toggle OFF) — `components/dashboard/MicroCard.tsx`

**Implementation:**
```tsx
// components/dashboard/MicroCardsGridClient.tsx
// Computed once for the whole grid — depends only on products,
// not on threshold, so it never recomputes while the slider moves.
const sparklines = useMemo(
  () => products.map((p) => processSparklineHistory(p.rawHistory)),
  [products],
);

{products.map((p, i) => (
  <MicroCard
    key={p.id}
    title={p.meta.title}
    sku={p.meta.sku}
    marginality={p.marginality}
    value={formatCurrency(p.metrics.currentValue)}
    rating={p.metrics.rating}
    sparklineData={sparklines[i]}   // the same array reference every time
    lowMargin={p.marginality < threshold}
  />
))}

// components/dashboard/MicroCard.tsx
export default memo(function MicroCard(props: Props) {
  return <MicroCardView {...props} />;
});
```

**Why this is fast:**
- The sparkline computation lives where its real dependency (`products`) lives — computed once, not on every slider move.
- Every card prop (except `lowMargin`) is a primitive or a stable array reference; `lowMargin` only flips for cards right at the current `threshold` boundary.
- `React.memo` genuinely pays off here: most of the 100 cards skip a full re-render on every slider tick.

---

## Bad code (Toggle ON) — `components/dashboard/MicroCardUnoptimized.tsx`

**Implementation:**
```tsx
// components/dashboard/MicroCardsGridClient.tsx
{products.map((p) => (
  <MicroCardUnoptimized
    key={p.id}
    card={{ ...p }}          // a fresh object on every parent render
    threshold={threshold}
  />
))}

// components/dashboard/MicroCardUnoptimized.tsx
const MicroCardUnoptimized = memo(function MicroCardUnoptimized({ card, threshold }: Props) {
  // The developer tried to memoize the sparkline right here, in the card —
  // but card is fresh every time, so this cache would never hit.
  // const sparklineData = useMemo(() => processSparklineHistory(card.rawHistory), [card]);
  const sparklineData = processSparklineHistory(card.rawHistory);
  return <MicroCardView sparklineData={sparklineData} /* ... */ />;
});
```

**Three things stacked here:**
1. `card={{ ...p }}`: a new object reference on every render of `MicroCardsGridClient` (the `products` array isn't memoized at this call site). `React.memo` compares `prevProps !== nextProps`, always `true`, so the card fully re-renders anyway, despite `memo`.
2. `threshold={threshold}`: the raw slider value is passed straight through to every card, instead of a derived per-card flag the way the good path does (`lowMargin`). Even if `card` were perfectly stable, this alone still fails `memo`'s comparison for all 100 cards on every tick, since the same changed number reaches every card, regardless of whether that particular card's visual state actually changed.
3. The sparkline computation (`processSparklineHistory`) is called **inside every card**, even though it only depends on `card.rawHistory` (i.e. on `products`), not on `threshold`. Even if `card` were stable and `React.memo` worked, that wouldn't matter for each card's first render, and wouldn't fix the architectural mistake: the expensive computation simply sits at the wrong level.

**Why this is slow (with no artificial simulation):**
- On every slider tick: all 100 cards go through a prop comparison in `React.memo` (always failing) + all 100 fully re-render + all 100 redo the clean → smooth → downsample pass over 365 "raw" points.
- The main thread blocks — INP and Blocking Time both rise, more noticeably on mobile/slower devices.

**UI behavior:**
- All 100 cards flash at once (`FlashOnUpdate`) on every slider tick.
- On an actual drag (not a single click), the Performance Panel shows a **"Memo Overhead — Rerendered Nodes on Action: N"** alert.
  - The counter (`store/render-counter.ts`) accumulates across the entire continuous drag instead of resetting on every tick (`startTrackingIfIdle`), so a single click always yields ≤100 and never shows the alert — the alert only appears once N exceeds 100, i.e. once the slider is genuinely being dragged, not just clicked once. This is mathematically guaranteed: over one monotonic move of `threshold`, each card can flip its `lowMargin` at most once, so the good path alone can never exceed ~100.

---

## Analysis

The contrast is measurable and visible, not just in INP numbers: in the good variant, only a handful of cards (the ones whose `lowMargin` just flipped) actually re-render on each slider tick, the rest are skipped by `React.memo` thanks to stable props, and the sparkline is never recomputed while the slider moves. In the bad variant, all 100 cards re-render on every tick — plus 100 wasted prop comparisons, plus the sparkline pipeline recomputing for all 100 instead of once. The overhead is real and measurable, with no artificial delays; on weaker devices and mobile the effect is even more pronounced.
