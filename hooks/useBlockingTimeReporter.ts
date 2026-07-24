import { useEffect } from "react";

import { useSimPerformanceStore } from "@/store/simulator-performance";

// Called once from SimulatorEffects, observes Long Tasks (main-thread blocks over 50ms) via PerformanceObserver and reports each one's duration as "Blocking Time" in the floating Performance Panel.
export function useBlockingTimeReporter() {
  const setBlockingTime = useSimPerformanceStore(
    (state) => state.setBlockingTime,
  );

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) setBlockingTime(Math.round(last.duration));
    });
    observer.observe({ type: "longtask", buffered: true });

    return () => observer.disconnect();
  }, [setBlockingTime]);
}
