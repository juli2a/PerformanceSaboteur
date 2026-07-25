import { CLSThresholds, INPThresholds, LCPThresholds } from "web-vitals";

// Official Google CWV "poor" cutoffs, re-exported here so every consumer (desktop PerformancePanel, mobile MobilePerformanceDock) reads the same values instead of importing web-vitals thresholds in more than one place.
export const LCP_POOR = LCPThresholds[1];
export const CLS_POOR = CLSThresholds[1];
export const INP_GOOD = INPThresholds[0];
export const INP_POOR = INPThresholds[1];

// Blocking Time has no official Google threshold (it's our own Long-Tasks reading, not a CWV). 100ms is the classic "still feels instant" cutoff (Nielsen's response-time heuristic); the Long Tasks API floor is 50ms, so without this a barely-over-the-floor task would read as "degraded" for no real reason. 500ms+ matches the same severity register as INP's own poor threshold, the order of magnitude our Case 3 freeze produces.
export const BLOCKING_TIME_GOOD = 100;
export const BLOCKING_TIME_POOR = 500;

// Official web.dev explainer for each Core Web Vital, linked from the metric labels in the Performance Panel so a reader can go straight to Google's own definition instead of trusting our gauge at face value.
export const VITAL_DOCS_URL = {
  lcp: "https://web.dev/articles/lcp",
  cls: "https://web.dev/articles/cls",
  inp: "https://web.dev/articles/inp",
} as const;
