import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getLastDay,
  buildSalesChartData,
  buildOrderSegments,
  compareOrderHalves,
} from "@/lib/utils/chart";
import type { CartEntry } from "@/types/analytics";

// Builds an ISO timestamp from local-time fields (month is 0-indexed, like the native Date constructor) so fixtures stay in the same local calendar as the faked system clock, avoiding any UTC-vs-local drift.
const iso = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
) => new Date(year, month, day, hour, minute).toISOString();

// See chart.ts: yesterday is the last complete day.
describe("getLastDay", () => {
  afterEach(() => vi.useRealTimers());

  it("returns yesterday at local midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 17, 15, 30, 0));
    const last = getLastDay();
    expect(last.getTime()).toBe(new Date(2026, 6, 16, 0, 0, 0, 0).getTime());
  });
});

// aggregateByHour/aggregateByDay are internal to chart.ts (not exported), exercised here through the public buildSalesChartData, which is how the rest of the app actually calls them (see docs/data.md).
describe("buildSalesChartData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 17, 15, 30, 0)); // lastDay = 2026-07-16
  });
  afterEach(() => vi.useRealTimers());

  describe(".day (hourly buckets for yesterday)", () => {
    it("excludes orders from a different calendar day and sums same-hour orders", () => {
      const orders: CartEntry[] = [
        { timestamp: iso(2026, 6, 16, 5, 10), value: 100 }, // lastDay, hour 5
        { timestamp: iso(2026, 6, 16, 5, 45), value: 50 }, // lastDay, hour 5 too
        { timestamp: iso(2026, 6, 15, 5, 0), value: 999 }, // day before, same hour, must be dropped
      ];
      const { day } = buildSalesChartData(orders);
      // If the date filter were broken, this slot would read 1149, not 150.
      expect(day[5]).toEqual({ label: "05:00", value: 150, count: 2 });
    });

    it("keeps hours with no orders as zero-filled slots, 24 total", () => {
      const orders: CartEntry[] = [
        { timestamp: iso(2026, 6, 16, 5, 10), value: 100 },
      ];
      const { day } = buildSalesChartData(orders);
      expect(day).toHaveLength(24);
      expect(day[10]).toEqual({ label: "10:00", value: 0, count: 0 });
    });
  });

  describe(".week / .month (day buckets, label format depends on days<=7)", () => {
    // D + F: two orders on lastDay itself (different hours), landing in the newest slot of both .week and .month, and doubling as the "two orders on the same day get summed" case.
    // E: one day before the .week window (window is July10-16) but still inside the .month window (June17-July16), proving the same order is dropped by one window and kept by the other, driven purely by `days`.
    const orders: CartEntry[] = [
      { timestamp: iso(2026, 6, 16, 9, 0), value: 200 }, // D
      { timestamp: iso(2026, 6, 16, 18, 0), value: 50 }, // F
      { timestamp: iso(2026, 6, 9, 12, 0), value: 9999 }, // E
    ];

    it(".week labels each slot with a short weekday name (days<=7 branch)", () => {
      const { week } = buildSalesChartData(orders);
      expect(week).toHaveLength(7);
      const expectedLabel = new Date(2026, 6, 16).toLocaleString("en-US", {
        weekday: "short",
      });
      expect(week[6].label).toBe(expectedLabel); // newest slot = lastDay
    });

    it(".month labels each slot as 'D Mon' (days>7 branch)", () => {
      const { month } = buildSalesChartData(orders);
      expect(month).toHaveLength(30);
      expect(month[0].label).toBe("17 Jun"); // oldest slot = lastDay - 29 days
      expect(month[29].label).toBe("16 Jul"); // newest slot = lastDay
    });

    it("drops an order that falls outside the 7-day window but keeps it inside the 30-day window", () => {
      const { week, month } = buildSalesChartData(orders);
      const weekTotal = week.reduce((sum, p) => sum + p.value, 0);
      const monthTotal = month.reduce((sum, p) => sum + p.value, 0);
      expect(weekTotal).toBe(250); // D + F only, E (9999) is outside .week's window
      expect(monthTotal).toBe(10249); // D + F + E, all three fit .month's wider window
    });

    it("sums two orders that land on the same day into one slot", () => {
      const { week } = buildSalesChartData(orders);
      expect(week[6]).toMatchObject({ value: 250, count: 2 }); // D + F
    });
  });
});

// Exported directly: window of segmentCount*segmentDays days ending at lastDay, split into segmentCount equal buckets via floor(dayIndex/segmentDays).
describe("buildOrderSegments", () => {
  const lastDay = new Date(2026, 6, 16); // window (segmentCount=3, segmentDays=2): July11-16
  const segmentCount = 3;
  const segmentDays = 2;

  it("places an order on lastDay itself in the last segment", () => {
    const orders: CartEntry[] = [{ timestamp: iso(2026, 6, 16), value: 300 }];
    const segments = buildOrderSegments(orders, lastDay, segmentCount, segmentDays);
    expect(segments[2]).toEqual({ revenue: 300, count: 1 });
    expect(segments[0]).toEqual({ revenue: 0, count: 0 });
    expect(segments[1]).toEqual({ revenue: 0, count: 0 });
  });

  it("places an order on the oldest day of the window (startDay) in the first segment", () => {
    const orders: CartEntry[] = [{ timestamp: iso(2026, 6, 11), value: 400 }];
    const segments = buildOrderSegments(orders, lastDay, segmentCount, segmentDays);
    expect(segments[0]).toEqual({ revenue: 400, count: 1 });
  });

  it("drops an order from one day before the window", () => {
    const orders: CartEntry[] = [{ timestamp: iso(2026, 6, 10), value: 500 }];
    const segments = buildOrderSegments(orders, lastDay, segmentCount, segmentDays);
    for (const s of segments) {
      expect(s).toEqual({ revenue: 0, count: 0 });
    }
  });

  it("sums two orders that fall in the same segment", () => {
    const orders: CartEntry[] = [
      { timestamp: iso(2026, 6, 13), value: 100 }, // segment 1
      { timestamp: iso(2026, 6, 14), value: 150 }, // segment 1
    ];
    const segments = buildOrderSegments(orders, lastDay, segmentCount, segmentDays);
    expect(segments[1]).toEqual({ revenue: 250, count: 2 });
  });
});

// Exported directly: splits segments in half, compares older vs newer sums. percentChange (internal) is only reachable through this function, so its first===0 branches are exercised here rather than imported separately.
describe("compareOrderHalves", () => {
  it("computes % change for revenue, orders and avgCheck from real growth", () => {
    // older = seg0+seg1 = {revenue:200, count:4}; newer = seg2+seg3 = {revenue:300, count:4}
    // revenue: (300-200)/200*100 = 50 ; orders: (4-4)/4*100 = 0
    // avgCheck: older 200/4=50, newer 300/4=75 -> (75-50)/50*100 = 50
    const segments = [
      { revenue: 100, count: 2 },
      { revenue: 100, count: 2 },
      { revenue: 150, count: 2 },
      { revenue: 150, count: 2 },
    ];
    expect(compareOrderHalves(segments)).toEqual({
      revenue: 50,
      orders: 0,
      avgCheck: 50,
    });
  });

  it("reports +100% revenue change when the older half had zero and the newer half doesn't", () => {
    const segments = [
      { revenue: 0, count: 0 },
      { revenue: 0, count: 0 },
      { revenue: 100, count: 2 },
      { revenue: 100, count: 2 },
    ];
    expect(compareOrderHalves(segments).revenue).toBe(100);
  });

  it("reports 0% revenue change when both halves are zero", () => {
    const segments = [
      { revenue: 0, count: 0 },
      { revenue: 0, count: 0 },
      { revenue: 0, count: 0 },
      { revenue: 0, count: 0 },
    ];
    expect(compareOrderHalves(segments).revenue).toBe(0);
  });

  it("guards avgCheck separately when the older half has zero orders (no division by zero)", () => {
    // Same fixture as the +100% case above, but this test targets the
    // avgCheck-specific ternary guard (`older.count > 0 ? ... : 0`), which
    // is separate code from percentChange's own first===0 branch.
    const segments = [
      { revenue: 0, count: 0 },
      { revenue: 0, count: 0 },
      { revenue: 100, count: 2 },
      { revenue: 100, count: 2 },
    ];
    expect(compareOrderHalves(segments).avgCheck).toBe(100);
  });
});
