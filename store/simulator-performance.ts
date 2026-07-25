import { create } from "zustand";

import { createPeakHoldQueue } from "@/lib/utils/peak-hold-queue";
import {
  BLOCKING_TIME_GOOD,
  BLOCKING_TIME_POOR,
  INP_GOOD,
  INP_POOR,
} from "@/lib/simulator-thresholds";
import type { SimPerformanceState } from "@/types/simulator";

// Never persisted: this is live data reported by web-vitals and the other PerformanceObserver-based reporters each session, and must start fresh, never restored from a stale localStorage snapshot.
export const useSimPerformanceStore = create<SimPerformanceState>()((set) => {
  const enqueueBlockingTime = createPeakHoldQueue(
    BLOCKING_TIME_GOOD,
    BLOCKING_TIME_POOR,
    (value) => set({ blockingTime: value }),
  );
  const enqueueInteractionLatency = createPeakHoldQueue(
    INP_GOOD,
    INP_POOR,
    (value) => set({ interactionLatency: value }),
  );

  return {
    vitals: { lcp: null, cls: null, inp: null },
    setVital: (key, reading) =>
      set((state) => ({ vitals: { ...state.vitals, [key]: reading } })),
    domNodes: null,
    setDomNodes: (count) => set({ domNodes: count }),
    rerenderedNodes: {},
    setRerenderedNodes: (key, count) =>
      set((state) => ({
        rerenderedNodes: { ...state.rerenderedNodes, [key]: count },
      })),
    blockingTime: 0,
    setBlockingTime: enqueueBlockingTime,
    interactionLatency: 0,
    setInteractionLatency: enqueueInteractionLatency,
    mobilePanelHeight: 0,
    setMobilePanelHeight: (height) => set({ mobilePanelHeight: height }),
  };
});
