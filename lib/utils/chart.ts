// Server-side order aggregation, same input always produces same output. Feeds both the sales chart (ChartPoint[]) and the KPI sparklines (OrderSegment[]).

import type { CartEntry, ChartPoint, SalesChartData } from "@/types/analytics";

// Yesterday is the last complete day; today's data is still partial.
export function getLastDay(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function aggregateByHour(orders: CartEntry[], lastDay: Date): ChartPoint[] {
  const lastDayStr = lastDay.toDateString();
  const hours = Array.from({ length: 24 }, () => ({ value: 0, count: 0 }));
  orders
    .filter((o) => new Date(o.timestamp).toDateString() === lastDayStr)
    .forEach((o) => {
      const slot = hours[new Date(o.timestamp).getHours()];
      slot.value += o.value;
      slot.count++;
    });
  return hours.map(({ value, count }, hour) => ({
    label: `${hour.toString().padStart(2, "0")}:00`,
    value: Math.round(value),
    count,
  }));
}

function aggregateByDay(
  orders: CartEntry[],
  lastDay: Date,
  days: number,
): ChartPoint[] {
  const slots = Array.from({ length: days }, (_, i) => {
    const d = new Date(lastDay);
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      dateStr: d.toDateString(),
      label:
        days <= 7
          ? d.toLocaleString("en-US", { weekday: "short" })
          : `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`,
      value: 0,
      count: 0,
    };
  });

  const slotByDate = new Map(slots.map((s) => [s.dateStr, s]));
  orders.forEach((o) => {
    const slot = slotByDate.get(new Date(o.timestamp).toDateString());
    if (slot) {
      slot.value += o.value;
      slot.count++;
    }
  });

  return slots.map(({ label, value, count }) => ({
    label,
    value: Math.round(value),
    count,
  }));
}

// "day" = yesterday by hour; "week"/"month" = the 7 / 30 days ending yesterday.
export function buildSalesChartData(orders: CartEntry[]): SalesChartData {
  const lastDay = getLastDay();
  return {
    day: aggregateByHour(orders, lastDay),
    week: aggregateByDay(orders, lastDay, 7),
    month: aggregateByDay(orders, lastDay, 30),
  };
}

export interface OrderSegment {
  revenue: number;
  count: number;
}

// Splits the segmentCount * segmentDays window ending lastDay into equal-size buckets (oldest → newest), e.g. 10 buckets of 3 days for a KPI sparkline.
export function buildOrderSegments(
  orders: CartEntry[],
  lastDay: Date,
  segmentCount: number,
  segmentDays: number,
): OrderSegment[] {
  const totalDays = segmentCount * segmentDays;
  const startDay = new Date(lastDay);
  startDay.setDate(startDay.getDate() - (totalDays - 1));

  const segments: OrderSegment[] = Array.from({ length: segmentCount }, () => ({
    revenue: 0,
    count: 0,
  }));

  orders.forEach((o) => {
    const orderDay = new Date(o.timestamp);
    orderDay.setHours(0, 0, 0, 0);
    const dayIndex = Math.round(
      (orderDay.getTime() - startDay.getTime()) / 86_400_000,
    );
    const segment = segments[Math.floor(dayIndex / segmentDays)];
    if (segment) {
      segment.revenue += o.value;
      segment.count += 1;
    }
  });

  return segments;
}

function sumSegments(segments: OrderSegment[]): OrderSegment {
  return segments.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.revenue,
      count: acc.count + s.count,
    }),
    { revenue: 0, count: 0 },
  );
}

function percentChange(first: number, last: number): number {
  if (first === 0) return last === 0 ? 0 : 100;
  return Math.round(((last - first) / first) * 100);
}

// % change from the older half of the window to the newer half; comparing two multi-day sums is more stable than comparing two single endpoint segments, which a single noisy day can flip the sign of.
export function compareOrderHalves(segments: OrderSegment[]): {
  revenue: number;
  orders: number;
  avgCheck: number;
} {
  const mid = Math.floor(segments.length / 2);
  const older = sumSegments(segments.slice(0, mid));
  const newer = sumSegments(segments.slice(mid));

  return {
    revenue: percentChange(older.revenue, newer.revenue),
    orders: percentChange(older.count, newer.count),
    avgCheck: percentChange(
      older.count > 0 ? older.revenue / older.count : 0,
      newer.count > 0 ? newer.revenue / newer.count : 0,
    ),
  };
}
