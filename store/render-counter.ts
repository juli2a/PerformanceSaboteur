import { create } from "zustand";

import type { CaseKey } from "@/types/simulator";

// Keyed by case: FlashOnUpdate instances from different cases (Case 7's table rows, Case 8's micro-cards) feed independent counters here, so a burst tracked for one case never gets read or evaluated as if it belonged to another. `increment(key)` only counts while `counters[key].isTracking` is on, so re-renders caused by anything other than a tracked action (category filters, Bulk Actions, Select All, an unrelated case's own re-renders) never pollute the count.
interface CounterEntry {
  count: number;
  isTracking: boolean;
}

interface RenderCounterState {
  counters: Partial<Record<CaseKey, CounterEntry>>;
  // Always resets to a fresh {count:0, isTracking:true}; correct when every tracked action is self-contained (Case 7: one checkbox click, one burst).
  startTracking: (key: CaseKey) => void;
  // Resets only if this key isn't already tracking; otherwise leaves the running count untouched. Lets a continuous stream of actions (Case 8: many slider-drag ticks in a row) accumulate into one burst instead of each tick wiping the count back to 0.
  startTrackingIfIdle: (key: CaseKey) => void;
  increment: (key: CaseKey) => void;
  stopTracking: (key: CaseKey) => void;
}

export const useRenderCounterStore = create<RenderCounterState>((set, get) => ({
  counters: {},
  startTracking: (key) =>
    set((state) => ({
      counters: { ...state.counters, [key]: { count: 0, isTracking: true } },
    })),
  startTrackingIfIdle: (key) =>
    set((state) => {
      if (state.counters[key]?.isTracking) return state;
      return {
        counters: { ...state.counters, [key]: { count: 0, isTracking: true } },
      };
    }),
  increment: (key) => {
    const entry = get().counters[key];
    if (!entry?.isTracking) return;
    set((state) => ({
      counters: {
        ...state.counters,
        [key]: { ...entry, count: entry.count + 1 },
      },
    }));
  },
  stopTracking: (key) =>
    set((state) => {
      const entry = state.counters[key];
      if (!entry) return state;
      return {
        counters: { ...state.counters, [key]: { ...entry, isTracking: false } },
      };
    }),
}));
