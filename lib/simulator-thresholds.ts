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

// Short explainers for the three custom metrics, shown via TooltipInfoTrigger next to each stat's label (unlike LCP/CLS/INP, which link out to their own web.dev page instead).
export const METRIC_TOOLTIPS = {
  domNodes:
    "Total DOM elements on the page right now. There's no universal good number, it depends on the page, but a sudden spike usually means something mounted far more than what's visible.",
  blockingTime:
    "Duration of the most recent Long Task, a stretch of uninterrupted JS over 50ms that froze the main thread. The same signal behind Lighthouse's Total Blocking Time.",
  interactionLatency:
    "How long the last click, tap, or key press took to get a response, from input to the next painted frame. Built from the same signal as INP, but unlike INP, this number updates live on every interaction over ~16ms and can rise or fall, added here for easy real-time tracking.",
} as const;
