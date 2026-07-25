// Deterministic derivation functions: same input always produces same output. Used server-side so cards/charts are stable across renders.

const REGIONS = ["Kyiv", "Lviv", "Kharkiv", "Odesa", "Dnipro"] as const;

export function deriveRegion(productId: number): string {
  return REGIONS[productId % REGIONS.length];
}

// LTV = user.id * 1250 + user.age * 300  (per docs/data.md)
export function deriveLtv(userId: number, userAge: number): number {
  return Math.round(userId * 1250 + userAge * 300);
}

// Returns true (up/green) or false (down/red) based on the last changing segment.
// Falls back to previous segments if the last is flat; all-flat → false.
export function deriveTrend(data: number[]): boolean {
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i] > data[i - 1]) return true;
    if (data[i] < data[i - 1]) return false;
  }
  return false;
}

// A year of daily "raw" readings for a product's value history, the input the client-side sparkline pipeline (lib/utils/sparkline-processing.ts) cleans, smooths and downsamples before display. Every 14th day gets a deterministic one-off spike (a promo-day sales bump, a tracking glitch, the kind of single-point outlier real daily metrics actually have), so the pipeline's outlier-removal step has something real to remove.
//
// The underlying wave runs exactly one cycle across the full `days` window (not a short multi-cycle-per-year wave); the sparkline pipeline downsamples to just a handful of points, and a higher-frequency wave aliases against that bucket size into a spurious zigzag instead of a readable trend.
export function deriveRawHistory(
  productId: number,
  basePrice: number,
  days = 365,
): number[] {
  const cycle = (2 * Math.PI) / days;
  return Array.from({ length: days }, (_, i) => {
    const base =
      basePrice * (0.85 + 0.1 * Math.sin(productId * 12.9898 + i * cycle));
    const spike = i % 14 === 0 ? basePrice * 0.6 : 0;
    return Math.round(base + spike);
  });
}

// Avatar gradient hue (0-359) for a customer's initials badge
export function deriveHue(userId: number): number {
  return (userId * 47) % 360;
}

// Deterministic pseudo-random float in [0, 1) from (seed, i), a classic sine-hash trick. Same (seed, i) always produces the same value, so a day-seeded scatter loop stays stable across requests within that day.
export function deriveScatterFloat(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Deterministic pseudo-random index in [0, max); see deriveScatterFloat.
export function deriveScatterIndex(
  seed: number,
  i: number,
  max: number,
): number {
  return Math.floor(deriveScatterFloat(seed, i) * max);
}

// % change comparing the sum of the first half of a series to the sum of the second half, the same first-half-vs-second-half comparison the real order-based KPIs use (see compareOrderHalves in lib/utils/chart.ts), so a synthetic spark is scored the same way.
export function deriveHalfWindowDeltaPercent(spark: number[]): number {
  const mid = Math.floor(spark.length / 2);
  const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);
  const older = sum(spark.slice(0, mid));
  const newer = sum(spark.slice(mid));
  if (older === 0) return newer === 0 ? 0 : 100;
  return Math.round(((newer - older) / older) * 100);
}

// Builds a deterministic 10-point upward sparkline ending at currentValue, matching the segment window buildOrderSegments produces for the real KPIs. Growth is always positive; this demo never shows a declining KPI for unique clients (no real per-day user signal to derive it from).
export function deriveKpiTrend(
  currentValue: number,
  seed: number,
): { deltaPercent: number; spark: number[] } {
  const growthPercent = 2 + (seed % 12);
  const startValue = currentValue / (1 + growthPercent / 100);
  const spark = Array.from({ length: 10 }, (_, index) => {
    const progress = index / 9;
    const wobble = 1 + Math.sin(seed + index * 7) * 0.04;
    return Math.round(
      (startValue + (currentValue - startValue) * progress) * wobble,
    );
  });
  // The ±4% per-point wobble can outweigh the underlying trend across only 10 points, so the half-window comparison alone isn't guaranteed positive; floor it at growthPercent's own minimum to keep that guarantee.
  return {
    deltaPercent: Math.max(2, deriveHalfWindowDeltaPercent(spark)),
    spark,
  };
}
