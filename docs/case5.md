# Case 5: Request Waterfall

**Category:** Network / Server architecture
**Toggle:** Network → Request waterfall
**Metric:** LCP

## Summary

Awaiting independent server requests sequentially artificially delays page rendering — LCP rises because nothing can render until the last request finishes.

> **Note:** the case originally demonstrated TTFB too, but on Vercel production this metric doesn't reflect the artificial delay (Early Hints — see `docs/production-issues.md`), so TTFB was dropped from the project, and the case is now demonstrated through LCP alone.

---

## Implementation

The `waterfall` cookie is read directly by the page's server component — there's no separate API route at all:

```ts
// app/(shell)/dashboard/page.tsx
const isWaterfallOn = cookieStore.get("waterfall")?.value === "on";
// ...
{isWaterfallOn ? <DashboardContentUnoptimized /> : <DashboardContent />}
```

Each `get*` function in `lib/server/dal/dashboard.ts` has its own artificial delay (`await sleep(N)`, memoized via `React.cache`) to simulate realistic DB queries in a microservice architecture:

| Function           | Endpoint                    | Delay |
| ------------------- | --------------------------- | ----- |
| `getProducts()`     | `GET /products?limit=100`   | 800ms |
| `getCarts()`        | `GET /carts?limit=100`      | 700ms |
| `getUsers()`        | `GET /users?limit=100`      | 600ms |
| `getCategories()`   | `GET /products/categories`  | 400ms |

---

## Good code (Toggle OFF)

**Implementation:** `components/dashboard/DashboardContent.tsx`

```tsx
<Suspense fallback={<BannerSkeleton />}><TopProductsBanner /></Suspense>
<Suspense fallback={<KpiSkeleton />}><KpiGrid /></Suspense>
<Suspense fallback={<ChartSkeleton />}><SalesChart /></Suspense>
<Suspense fallback={<AnalyticsPairSkeleton />}>
  <CategoryAnalytics /><TopCustomers />
</Suspense>
<Suspense fallback={<MicroCardsSkeleton />}><MicroCardsGrid /></Suspense>
```

> Each section fetches its own data independently inside its own Suspense boundary — the server starts streaming HTML immediately, and sections appear as they become ready instead of all at once at the end.

**UI behavior:**
- The Dashboard streams in section by section: banner ~250ms, categories/customers ~400-600ms, KPI+chart ~700ms, micro cards ~800ms.
- Total time to a full dashboard ≈ the slowest request, not their sum.
- LCP stays in the good zone.

---

## Bad code (Toggle ON)

**Implementation:** `components/dashboard/DashboardContentUnoptimized.tsx`

```tsx
export async function DashboardContentUnoptimized() {
  const { kpi, salesChart } = await getCarts();   // 700ms
  const products = await getProducts();           // +800ms
  const users = await getUsers();                 // +600ms
  const categories = await getCategories();       // +400ms
  return ( /* the whole dashboard renders as one block, no Suspense */ );
}
```

> A single `async` Server Component with no Suspense boundary at all — Next.js can't send a single byte until the whole chain settles, ≈2500ms+.

**UI behavior:**
- The Dashboard stays blank for several seconds, then the whole layout appears at once — instead of streaming in section by section.
- LCP spikes sharply and lands in the poor zone of the metrics panel — that's the case's only indicator, no alert popup.

---

## Analysis

**Demonstration success probability: 9/10**

**Toggle ↔ server architecture:** toggles live in Zustand with the `persist` middleware (→ localStorage). Case 5 (like Layout Shift, Unoptimized Images, and Hydration mismatch — all of `SSR_COOKIE_CASES`) additionally writes a cookie on every change and immediately triggers a full page reload, `window.location.reload()` (`hooks/useToggleCase.ts`) — not `router.refresh()`. Other toggles' state "survives" the reload not because client state is preserved, but because Zustand's `persist` re-reads `localStorage` after the app fully remounts.

**Artificial delays:** DummyJSON responds in ~150-300ms — without delays, the difference between parallel and sequential would be only ~600ms and barely noticeable. The delays simulate realistic B2B conditions (complex DB aggregations, cross-service calls) and are a legitimate pedagogical device.

**API:** ✅ All 4 endpoints exist in DummyJSON:

- `GET /products?limit=100` ✅
- `GET /carts?limit=100` ✅
- `GET /users?limit=100` ✅
- `GET /products/categories` ✅

**UI/case fit:** ✅ Each of the 4 requests has its own UI section on the Dashboard.
