import { useEffect } from "react";

import { useRenderCounterStore } from "@/store/render-counter";
import { useSimPerformanceStore } from "@/store/simulator-performance";
import { useSimControlStore } from "@/store/simulator-control";
import type { CaseKey } from "@/types/simulator";

export const SETTLE_DELAY_MS = 100;

// Called from SimulatorEffects, once per case that feeds the render-counter store (see store/render-counter.ts), each with its own `caseKey` and `alertThreshold`. Watches that case's counter while it's tracking, restarting a SETTLE_DELAY_MS timer on every increment. Once the burst settles: publishes the total as "Rerendered Nodes" for that case and flags its alert only when the count clears `alertThreshold`.
export function useRerenderNodesReporter(
  caseKey: CaseKey,
  alertThreshold: number,
) {
  const entry = useRenderCounterStore((state) => state.counters[caseKey]);
  const stopTracking = useRenderCounterStore((state) => state.stopTracking);
  const setRerenderedNodes = useSimPerformanceStore(
    (state) => state.setRerenderedNodes,
  );
  const triggerAlert = useSimControlStore((state) => state.triggerAlert);
  const closeAlert = useSimControlStore((state) => state.closeAlert);

  const count = entry?.count ?? 0;
  const isTracking = entry?.isTracking ?? false;

  useEffect(() => {
    if (!isTracking) return;

    const timer = setTimeout(() => {
      setRerenderedNodes(caseKey, count);
      if (count > alertThreshold) triggerAlert(caseKey);
      else closeAlert(caseKey);
      stopTracking(caseKey);
    }, SETTLE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [
    count,
    isTracking,
    caseKey,
    alertThreshold,
    setRerenderedNodes,
    triggerAlert,
    closeAlert,
    stopTracking,
  ]);
}
