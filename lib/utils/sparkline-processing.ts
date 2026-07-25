// Client-side sparkline pipeline: a year of raw daily readings (lib/utils/derive.ts's deriveRawHistory) is cleaned, smoothed and downsampled to the 7 points the mini sparkline actually displays. Pure, deterministic functions: same input always produces the same output, so good and bad paths (see MicroCardsGridClient / MicroCardUnoptimized) render pixel-identical sparklines no matter which one computes it.

// Iterative IQR trim (winsorizing): repeatedly clamps points outside 1.5x the interquartile range to the nearest fence boundary they crossed, stopping once a pass changes nothing (capped at 5 passes so a pathological input can't loop forever). Clamping to the boundary rather than the Q1/Q3 midpoint matters here specifically: Sparkline.tsx scales its vertical axis straight off min/max of these 7 points, so an unclamped outlier would still blow up that range, but clamping to the midpoint could push a real upswing below its untouched neighbors, and since MicroCardView doesn't pass `isGood`, the card's up/down color comes from the shape of this exact array (see deriveTrend). Clamping to the boundary keeps relative order: the point that was highest among its neighbors stays highest.
export function removeOutliersIterative(
  data: number[],
  maxPasses = 5,
): number[] {
  let current = data;

  for (let pass = 0; pass < maxPasses; pass++) {
    const sorted = [...current].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    let changed = false;
    const next = current.map((value) => {
      if (value > upper) {
        changed = true;
        return upper;
      }
      if (value < lower) {
        changed = true;
        return lower;
      }
      return value;
    });

    current = next;
    if (!changed) break;
  }
  return current;
}

// Trailing moving average over `window` points.
export function movingAverage(data: number[], window = 7): number[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  });
}

// Splits `data` into `targetPoints` equal buckets and averages each one down to a single value.
export function downsampleTo(data: number[], targetPoints = 7): number[] {
  const bucketSize = data.length / targetPoints;
  return Array.from({ length: targetPoints }, (_, i) => {
    const start = Math.floor(i * bucketSize);
    const end = Math.floor((i + 1) * bucketSize);
    const bucket = data.slice(start, end);
    return Math.round(
      bucket.reduce((sum, value) => sum + value, 0) / bucket.length,
    );
  });
}

// Full pipeline: a year of raw daily readings → cleaned → smoothed → downsampled to the 7 points the mini sparkline displays.
export function processSparklineHistory(raw: number[]): number[] {
  const cleaned = removeOutliersIterative(raw);
  const smoothed = movingAverage(cleaned, 7);
  return downsampleTo(smoothed, 7);
}
