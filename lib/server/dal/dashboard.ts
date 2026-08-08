import { cache } from "react";
import { apiFetch } from "@/lib/server/fetcher";
import {
  deriveLtv,
  deriveRawHistory,
  deriveKpiTrend,
  deriveScatterIndex,
  deriveScatterFloat,
} from "@/lib/utils/derive";
import {
  getLastDay,
  buildSalesChartData,
  buildOrderSegments,
  compareOrderHalves,
} from "@/lib/utils/chart";
import type {
  KpiData,
  CartEntry,
  SalesChartData,
  AnalyticCardData,
  CategoryData,
  CustomerData,
} from "@/types/analytics";

// ─── DummyJSON shapes ──────────────────────────────────────────────────────────

interface DummyCart {
  id: number;
  discountedTotal: number;
  userId: number;
}

interface DummyProduct {
  id: number;
  title: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  sku: string;
}

interface DummyUser {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  company: { name: string };
}

// ─── Simulation params (stable within a calendar day) ─────────────────────────
// ordersCount and usersCount are both derived from today's date (via seed) so all Suspense streams stay consistent without coupling getCarts and getUsers at runtime; usersCount is always kept smaller than ordersCount.

function getDailySimConfig(): {
  seed: number;
  ordersCount: number;
  usersCount: number;
} {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return {
    seed,
    ordersCount: 130 + (seed % 21),
    usersCount: 90 + (seed % 31),
  };
}

// Biases order timestamps toward later hours (peak ~16–18h); Math.max(r1, r2) skews the uniform distribution rightward. index must be unique per cart so each order gets its own pseudo-random draw, seed keeps the whole set stable across requests within a day.
function setRealisticTime(d: Date, seed: number, index: number): Date {
  const r1 = deriveScatterFloat(seed, index * 3);
  const r2 = deriveScatterFloat(seed, index * 3 + 1);
  const r3 = deriveScatterFloat(seed, index * 3 + 2);
  const hour = Math.floor(Math.max(r1, r2) * 24);
  const minute = Math.floor(r3 * 60);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ─── Memoised per-request fetchers ────────────────────────────────────────────
// React.cache deduplicates within a single render pass: KpiGrid and SalesChart both call getCarts() but trigger only one fetch.
//
// The four delays below are a deliberate pedagogical device (docs/case5.md), not real DB latency, exported by name (rather than inlined into each setTimeout) so anything that reasons about their magnitude, e.g. e2e/case5-waterfall.spec.ts's streaming-vs-blocking timing thresholds, can derive from the current values instead of duplicating separate hardcoded numbers that would silently drift out of sync if these are ever retuned.
export const CARTS_DELAY_MS = 700;
export const PRODUCTS_DELAY_MS = 800;
export const USERS_DELAY_MS = 600;
export const CATEGORIES_DELAY_MS = 400;

export const getCarts = cache(
  async (): Promise<{ kpi: KpiData; salesChart: SalesChartData }> => {
    await new Promise((r) => setTimeout(r, CARTS_DELAY_MS));

    const { seed, ordersCount, usersCount } = getDailySimConfig();

    const { carts } = await apiFetch<{ carts: DummyCart[] }>(
      `/carts?limit=${ordersCount}`,
    );
    const actualOrdersCount = carts.length; // actual count in case API returns fewer than requested

    // Build dayCounts: 30 slots, one per calendar day (oldest → newest), ending yesterday, since yesterday is the last complete day and today's is still partial. Every day is guaranteed at least 1 order; the remaining orders are scattered randomly across the 30 slots so the chart has natural variance.
    const lastDay = getLastDay();

    const dayCounts: Array<{ date: Date; count: number }> = Array.from(
      { length: 30 },
      (_, i) => {
        const d = new Date(lastDay);
        d.setDate(d.getDate() - (29 - i));
        return { date: d, count: 1 };
      },
    );

    for (let i = 30; i < actualOrdersCount; i++) {
      dayCounts[deriveScatterIndex(seed, i, 30)].count++;
    }

    // Drain: assign each cart a concrete timestamp; daySlotIdx advances when a day-slot is exhausted, no array mutation.
    let daySlotIdx = 0;
    const orders: CartEntry[] = carts.map((cart, i) => {
      const d = setRealisticTime(new Date(dayCounts[daySlotIdx].date), seed, i);

      dayCounts[daySlotIdx].count--;
      if (dayCounts[daySlotIdx].count === 0) daySlotIdx++;

      return { timestamp: d.toISOString(), value: cart.discountedTotal };
    });

    const totalRevenue = Math.round(
      orders.reduce((sum, order) => sum + order.value, 0),
    );
    const avgCheck = Math.round(totalRevenue / actualOrdersCount);

    // 10 segments of 3 days each, oldest → newest: real KPI sparklines built from the same orders the chart uses, instead of a synthetic curve.
    const segments = buildOrderSegments(orders, lastDay, 10, 3);
    const revenueSpark = segments.map((s) => Math.round(s.revenue));
    const ordersSpark = segments.map((s) => s.count);
    const avgCheckSpark = segments.map((s) =>
      s.count > 0 ? Math.round(s.revenue / s.count) : 0,
    );
    // Compares the first half of the segments against the second half: sums over each half, not single endpoint segments, so one noisy day can't flip the trend's sign.
    const halfDelta = compareOrderHalves(segments);

    return {
      kpi: {
        totalRevenue: {
          value: totalRevenue,
          deltaPercent: halfDelta.revenue,
          spark: revenueSpark,
        },
        totalOrders: {
          value: actualOrdersCount,
          deltaPercent: halfDelta.orders,
          spark: ordersSpark,
        },
        // No order-level signal for unique clients, stays synthetic.
        activeClients: {
          value: usersCount,
          ...deriveKpiTrend(usersCount, seed + 3),
        },
        avgCheck: {
          value: avgCheck,
          deltaPercent: halfDelta.avgCheck,
          spark: avgCheckSpark,
        },
      },
      salesChart: buildSalesChartData(orders),
    };
  },
);

export const getProducts = cache(async (): Promise<AnalyticCardData[]> => {
  await new Promise((r) => setTimeout(r, PRODUCTS_DELAY_MS));

  const { products } = await apiFetch<{ products: DummyProduct[] }>(
    "/products?limit=100",
  );

  return products.map((p) => ({
    id: String(p.id),
    meta: { title: p.title, sku: p.sku },
    metrics: {
      currentValue: Math.round(p.price * p.stock),
      rating: p.rating,
    },
    marginality: Math.round(p.discountPercentage),
    rawHistory: deriveRawHistory(p.id, p.price),
  }));
});

export const getUsers = cache(async (): Promise<CustomerData[]> => {
  await new Promise((r) => setTimeout(r, USERS_DELAY_MS));

  // usersCount is the same user-pool size that getCarts uses for activeClients, derived from the same daily seed; no runtime dependency between the two.
  const { usersCount } = getDailySimConfig();

  const { users } = await apiFetch<{ users: DummyUser[] }>(
    `/users?limit=${usersCount}`,
  );

  return users
    .map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      company: u.company.name,
      ltv: deriveLtv(u.id, u.age),
      orders: (u.id % 10) + 1,
    }))
    .sort((a, b) => b.ltv - a.ltv)
    .slice(0, 5);
});

export const getCategories = cache(async (): Promise<CategoryData[]> => {
  await new Promise((r) => setTimeout(r, CATEGORIES_DELAY_MS));

  const { products } = await apiFetch<{
    products: Pick<DummyProduct, "id" | "category" | "price" | "stock">[];
  }>("/products?limit=100&select=id,category,price,stock");

  const buckets: Record<string, { stockValue: number; count: number }> = {};
  let grandTotal = 0;

  for (const p of products) {
    const value = p.price * p.stock;
    buckets[p.category] ??= { stockValue: 0, count: 0 };
    buckets[p.category].stockValue += value;
    buckets[p.category].count += 1;
    grandTotal += value;
  }

  return Object.entries(buckets)
    .map(([slug, { stockValue, count }]) => ({
      name: slug.replace(/-/g, " "),
      slug,
      stockValue: Math.round(stockValue),
      share: Math.round((stockValue / grandTotal) * 100),
      productCount: count,
    }))
    .sort((a, b) => b.stockValue - a.stockValue)
    .slice(0, 8);
});

interface BannerDummyProduct {
  id: number;
  title: string;
  sku: string;
  images: string[];
  discountPercentage: number;
}

export interface BannerProduct {
  id: number;
  title: string;
  sku: string;
  images: string[];
  // discountPercentage used as GM% proxy, same convention as getProducts().
  marginality: number;
}

// Draws from a 100-product pool and keeps the 5 with the best GM%, so the hero banner leads with the most profitable products instead of an arbitrary API-order slice.
export const getBannerProducts = cache(async (): Promise<BannerProduct[]> => {
  const { products } = await apiFetch<{ products: BannerDummyProduct[] }>(
    "/products?limit=100&select=id,title,sku,images,discountPercentage",
  );
  return products
    .map(({ id, title, sku, images, discountPercentage }) => ({
      id,
      title,
      sku,
      images,
      marginality: Math.round(discountPercentage),
    }))
    .sort((a, b) => b.marginality - a.marginality)
    .slice(0, 5);
});
