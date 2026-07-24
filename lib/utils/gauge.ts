import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge";
import type { VitalRating } from "@/types/simulator";

const POOR_BREAKPOINT_PERCENT = 75;

// 0 → poorThreshold maps linearly to 0–75% of the ring. Beyond the threshold the fill asymptotically approaches 100% but never reaches it, so the ring keeps showing forward motion no matter how bad the value gets; see docs/ui.md "Floating Performance Panel".
export function getGaugePercent(value: number, poorThreshold: number): number {
  if (value <= 0) return 0;
  if (value <= poorThreshold) {
    return (value / poorThreshold) * POOR_BREAKPOINT_PERCENT;
  }
  return POOR_BREAKPOINT_PERCENT + 25 * (1 - poorThreshold / value);
}

// Worst rating among whatever metrics have reported so far; null only when none have (e.g. before first paint, or before any interaction for INP).
export function getOverallRating(
  ratings: (VitalRating | null)[],
): VitalRating | null {
  const known = ratings.filter(
    (rating): rating is VitalRating => rating !== null,
  );
  if (known.length === 0) return null;
  if (known.includes("poor")) return "poor";
  if (known.includes("degraded")) return "degraded";
  return "good";
}

// Classifies a plain non-CWV stat (Blocking Time, Interaction Latency) onto the same three-tier scale the gauges use, given its own good/poor cutoffs. Interaction Latency reuses INP's own official thresholds since it's a per-sample version of the same thing; Blocking Time has no official equivalent, so PerformancePanel picks its own.
export function getValueRating(
  value: number,
  good: number,
  poor: number,
): VitalRating {
  if (value <= good) return "good";
  if (value <= poor) return "degraded";
  return "poor";
}

type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

interface RatingPresentation {
  tone: BadgeTone;
  label: string;
  color: string;
  textClass: string;
}

const RATING_PRESENTATION: Record<VitalRating, RatingPresentation> = {
  good: {
    tone: "positive",
    label: "Good",
    color: "var(--color-pos)",
    textClass: "text-pos",
  },
  degraded: {
    tone: "amber",
    label: "Degraded",
    color: "var(--color-amber)",
    textClass: "text-amber",
  },
  poor: {
    tone: "alert",
    label: "Poor",
    color: "var(--color-alert)",
    textClass: "text-alert",
  },
};

export function getRatingPresentation(rating: VitalRating): RatingPresentation {
  return RATING_PRESENTATION[rating];
}
