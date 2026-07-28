# Case 3: Main Thread Blocking / Heavy Mounting & Parsing

**Category:** Computing / Client-side routing
**Toggle:** Computing → Heavy Mounting
**Metric:** INP, DOM Elements

## Summary
A page-transition freeze caused by synchronously mounting all 2000+ Inventory table rows into real DOM at once, instead of windowing just the up to 10 visible rows.

---

## Good code (Toggle OFF)

**Implementation:** `components/inventory/ProductTable.tsx`
```tsx
const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => (isMobile ? CARD_HEIGHT_PX : ROW_HEIGHT_PX),
  overscan: isMobile ? 6 : 10,
});
```
`@tanstack/react-virtual`'s `useVirtualizer` only mounts the rows near the current scroll position (inside its own `scrollRef` container, not the window), swapping which ones those are as you scroll — the mounted count never grows with the data.

**UI behavior:**
- The Dashboard → Inventory Control transition happens with no delay.
- DOM Nodes stays low (~15-20 mounted rows), INP stays low.

---

## Bad code (Toggle ON)

**Implementation:** `components/inventory/ProductTable.tsx`
```tsx
rows.map((row) => <ProductTableRow key={row.original.id} product={row.original} ... />)
```
Virtualization is disabled entirely — literally every one of the 2000+ rows mounts, each with its own complex shadcn hierarchy.

**UI behavior:**
- The old page stays put for several seconds; the first couple of clicks still land, then the app stops responding entirely until Inventory Control finally appears.
- The metrics panel shows DOM Nodes past 30,000 and INP spiking into the thousands of milliseconds; on a slower device, Blocking Time spikes too.

---

## Analysis

**Demonstration success probability: 9/10** — the most reliable case.
2000+ rows × a complex shadcn hierarchy, with no windowing at all — a guaranteed freeze independent of the network. `@tanstack/react-virtual` (already installed, `^3.14.3`) removes the effect completely.

**UI/case fit:** ✅ Full. Inventory Control Data Table.

**API:** ✅ `GET /products?limit=100` exists; data amplification (×20) happens server-side.
