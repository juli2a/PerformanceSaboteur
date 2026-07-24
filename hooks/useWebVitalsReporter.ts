import { useEffect } from "react";
import { onCLS, onINP, onLCP, type Metric } from "web-vitals";

import { useSimPerformanceStore } from "@/store/simulator-performance";
import type { VitalRating } from "@/types/simulator";

// web-vitals reports "needs-improvement"; the simulator's own scale reads as
// a clean three-word good/degraded/poor instead.
function toVitalRating(rating: Metric["rating"]): VitalRating {
  return rating === "needs-improvement" ? "degraded" : rating;
}

// Called once from SimulatorEffects, subscribes to web-vitals (LCP, CLS, INP) and writes readings to the simulator store; PerformancePanel reads from there.
export function useWebVitalsReporter() {
  const setVital = useSimPerformanceStore((state) => state.setVital);

  useEffect(() => {
    const report = (key: "lcp" | "cls" | "inp") => (metric: Metric) =>
      setVital(key, {
        value: metric.value,
        rating: toVitalRating(metric.rating),
      });

    // reportAllChanges: without it, each callback fires once, when the page is hidden/unloaded, since web-vitals defaults to reporting a final analytics-style value. The panel needs a live stream instead: a new LCP candidate, every layout shift, every interaction.
    onLCP(report("lcp"), { reportAllChanges: true });
    onCLS(report("cls"), { reportAllChanges: true });
    onINP(report("inp"), { reportAllChanges: true });
  }, [setVital]);
}
