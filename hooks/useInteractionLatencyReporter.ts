import { useEffect } from "react";

import { useSimPerformanceStore } from "@/store/simulator-performance";

// Called once from SimulatorEffects, observes Event Timing entries (click/tap/key interactions) via PerformanceObserver and reports each one's duration as "Interaction Latency" in the floating Performance Panel.
//
// This deliberately duplicates web-vitals' own INP data source rather than reusing its onINP() output: INP is a worst-case-this-session aggregate that only ever ratchets up (see docs/case3.md, docs/case8.md), so it can't show a Case 3 / Case 8 toggle's effect going away within the same session. This reporter keeps only the latest sample, so it rises and falls live.
export function useInteractionLatencyReporter() {
  const setInteractionLatency = useSimPerformanceStore(
    (state) => state.setInteractionLatency,
  );

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;

    const observer = new PerformanceObserver((list) => {
      // Only entries tied to a real discrete interaction count, same filter web-vitals' own InteractionManager uses (entries without an interactionId, e.g. hover/focus, aren't a "click/tap/key" latency and would otherwise inflate this past what INP itself would report).
      const durations = list
        .getEntries()
        .filter(
          (entry): entry is PerformanceEventTiming =>
            "interactionId" in entry && Boolean(entry.interactionId),
        )
        .map((entry) => entry.duration);
      // A single tap/click can produce several such entries (pointerdown, pointerup, click) in one callback batch; the longest one is the interaction's real latency, not necessarily the last.
      if (durations.length > 0) {
        setInteractionLatency(Math.round(Math.max(...durations)));
      }
    });
    observer.observe({ type: "event", buffered: true, durationThreshold: 16 });

    return () => observer.disconnect();
  }, [setInteractionLatency]);
}
