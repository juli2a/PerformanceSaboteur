import type { SimPerformanceState, VitalRating } from "@/types/simulator";

// Shared props between PerformancePanelDesktop and PerformancePanelMobile: both render the exact same underlying metrics, computed once in PerformancePanel and handed down, so neither duplicates the store reads or threshold maths.
export interface PerformancePanelMetrics {
  alerts: React.ReactNode[];
  vitals: SimPerformanceState["vitals"];
  domNodes: number | null;
  blockingTime: number;
  blockingTimeRating: VitalRating;
  interactionLatency: number;
  interactionLatencyRating: VitalRating;
  overallRating: VitalRating | null;
}
