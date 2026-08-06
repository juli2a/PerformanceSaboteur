# Data Fetching & Processing

## Overview

- Data source: **DummyJSON** public API — `https://dummyjson.com`
- Aggregation and transformation happen server-side (Next.js Server Components) for a realistic B2B setting.

---

## Dashboard — requests and processing

The Dashboard has **4 independent requests** (`lib/server/dal/dashboard.ts`) that demonstrate parallel Suspense streaming vs sequential fetching (Case 5, see `docs/case5.md`). Each `get*` function carries its own artificial delay — not a Route Handler, the functions themselves.

| Function            | Endpoint                    | Delay | UI section                              |
| -------------------- | --------------------------- | ----- | ---------------------------------------- |
| `getCarts()`         | `GET /carts?limit=N`        | 700ms | KPI cards (revenue/orders/clients/avgCheck) + Sales Chart |
| `getProducts()`      | `GET /products?limit=100`   | 800ms | Micro-cards Grid (Case 8)                |
| `getUsers()`         | `GET /users?limit=N`        | 600ms | Top Customers                            |
| `getCategories()`    | `GET /products/categories`  | 400ms | Category Analytics (its own separate fetch, doesn't reuse `getProducts()`) |

- **Good path (Case 5 OFF):** each section in its own `<Suspense>` boundary, streaming independently — total time ≈ the slowest request.
- **Bad path (Case 5 ON):** sequential `await`s in one Server Component with no Suspense — ≈2500ms+ total.

### getCarts — KPI + main sales chart

- `getDailySimConfig()` derives a deterministic daily seed → order count (130-150) and user-pool size (90-120).
- Order dates are distributed across 30 daily "slots" (counting back from yesterday), each day guaranteed ≥1 order; time of day is skewed toward evening hours (peak 16-18h) via `deriveScatterFloat`.
- **Total revenue** = sum of all carts' `discountedTotal`.
- **Average check** = Total revenue / Order count.
- **Active clients** = the daily user-pool size (not a deduplication over carts).
- The sales chart is built from the same orders as the KPI sparklines (`buildSalesChartData`).

### getCategories — Category Analytics

**Request:** `GET /products/categories` — a **separate fetch**, `/products?limit=100&select=id,category,price,stock` (doesn't reuse the array from `getProducts()`).

- Groups products by category, computes `stockValue = Σ(price × stock)` and its share of the grand total.
- Returns the top 8 categories by stock value.

### getUsers — Top Customers

**Request:** `GET /users?limit=N` (N — the daily user pool from `getDailySimConfig()`).

- Returns the **top 5 by LTV**, not the first 5 in API order.
- Lifetime Value: `Math.round(user.id * 1250 + user.age * 300)` (`deriveLtv`).

### getProducts — Micro-cards Grid (Case 8)

Feeds only the Analytics Grid — the data structure and client-side sparkline pipeline are documented in full in `docs/case8.md`, not duplicated here.

---

## Inventory Control — requests and processing

### Fetching the amplified base (2000+ rows)

**Request:** `GET /products?limit=100` (`lib/server/dal/inventory.ts`, `getAmplifiedProducts`).

### Data Amplification (server-side transformation)

The base 100 products are replicated ×20 → 2000+ rows:

```ts
for (let batch = 1; batch < 20; batch++) {
  for (const base of baseProducts) {
    const amplifiedId = base.id + batch * 100;
    amplifiedProducts.push({ ...base, id: amplifiedId, title: `${base.title} (Batch ${batch + 1})` });
  }
}
```

- `logisticStatus` is derived from **`stock` + `shippingInformation`** (a real DummyJSON field, 6 fixed shipping phrases): `stock ≤ 3` → "Out of Stock", `stock ≤ 10` → "To Order", otherwise a status based on shipping speed.
- `sku` — a real DummyJSON field, carried through unchanged; the same sku repeats across all 20 batches of a product.
- Only `title` gets a `(Batch N)` suffix for batches 2+.
- `deriveRealProductId(amplifiedId)` — the inverse function (`((id-1) % 100) + 1`), recovers the real id 1-100 for the Bulk Update below.

### Bulk Status Update (mutation)

- Implemented as a Next.js **Server Action** (`lib/server/actions/inventory.ts`, `"use server"`).
- For each selected `productId` (mapped back via `deriveRealProductId`), a **real PATCH** is sent to DummyJSON — no artificial delay.
- DummyJSON doesn't persist the change — the API just echoes the product back.
- The visible status change in the UI comes from a client-side **optimistic overlay** (`useInventoryStatusStore`), not cache invalidation via `revalidatePath`/`router.refresh()`.

---

## Case 8 — Micro-cards Grid

The full description of the data, field derivation, and client-side sparkline pipeline lives in `docs/case8.md` ("Data (identical for both variants)" and onward). Briefly: `GET /products?limit=100` with no `select` → 100 cards 1:1 (`AnalyticCardData`), the sparkline is computed client-side from 365 "raw" daily values (`deriveRawHistory`), not server-side.
