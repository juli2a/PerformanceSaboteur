// value: current period; deltaPercent + spark: derived vs. an implied previous period
export interface KpiMetric {
  value: number;
  deltaPercent: number;
  spark: number[];
}

export interface KpiData {
  totalRevenue: KpiMetric;
  totalOrders: KpiMetric;
  activeClients: KpiMetric;
  avgCheck: KpiMetric;
}

export interface ChartPoint {
  label: string;
  value: number;
  count: number;
}

// Pre-aggregated server-side; the client just switches which one it shows.
export interface SalesChartData {
  day: ChartPoint[];
  week: ChartPoint[];
  month: ChartPoint[];
}

// One entry per order. Server-only, aggregated into ChartPoint[] / KpiMetric spark series before being sent to the client.
export interface CartEntry {
  timestamp: string; // ISO 8601
  value: number;
}

export interface AnalyticCardData {
  id: string;
  meta: { title: string; sku: string };
  metrics: {
    currentValue: number; // price × stock (inventory value)
    rating: number;
  };
  marginality: number; // discountPercentage used as GM% proxy
  // A year of raw daily readings; the client-side sparkline pipeline (lib/utils/sparkline-processing.ts) cleans, smooths and downsamples this to the 7 points the mini sparkline actually displays.
  rawHistory: number[];
}

export interface CategoryData {
  name: string;
  slug: string;
  stockValue: number; // sum(price × stock) for all products in this category
  share: number; // % of total inventory value
  productCount: number;
}

export interface CustomerData {
  id: number;
  name: string;
  company: string;
  ltv: number;
  orders: number;
}
