"use client";

import { createContext, useState } from "react";

import type { LogisticStatus } from "@/types/inventory";
import { useSimulatorCase } from "@/hooks/useSimulatorCase";

export interface RowStatusContextValue {
  statuses: Map<number, LogisticStatus>;
  setStatuses: (ids: number[], status: LogisticStatus) => void;
}

export const RowStatusContext = createContext<RowStatusContextValue | null>(
  null,
);

// Case 7 (Context Overhead) mobile bad-path state, deliberately isolated from useInventoryStatusStore (the good-path store, also read by desktop's status badge on both its bad/good paths, see ProductTableRow / ProductTableRowUnoptimized), not a mirror of it, so the two demo modes never carry a stale status into one another. Mirrors that store's own API 1:1 (statuses/setStatuses) so ProductCard's status read and StatusChangeDrawer's write can target whichever source is active without behaving differently. Mounted once at the page root (alongside TableSelectionProvider), always present, but only ProductCardUnoptimized actually consumes it.
export function RowStatusProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatusesState] = useState<Map<number, LogisticStatus>>(
    new Map(),
  );
  const isContextOverheadOn = useSimulatorCase("contextOverhead");

  // Clears on every toggle flip, in either direction, so this isolated status map never carries over from or into the Zustand-backed one. React's own documented "adjusting state when a prop changes" pattern (setting state directly during render, guarded by a comparison against the previous value) rather than a useEffect, which would cause an extra cascading render for the same update.
  const [prevToggle, setPrevToggle] = useState(isContextOverheadOn);
  if (isContextOverheadOn !== prevToggle) {
    setPrevToggle(isContextOverheadOn);
    setStatusesState(new Map());
  }

  // Anti-pattern (see docs/case7.md): every mutation replaces the whole Map with a new instance, with no memoization; every consumer of this Provider's value re-renders on every change, not just the card whose status changed.
  const setStatuses = (ids: number[], status: LogisticStatus) => {
    setStatusesState((prev) => {
      const next = new Map(prev);
      for (const id of ids) next.set(id, status);
      return next;
    });
  };

  return (
    <RowStatusContext.Provider value={{ statuses, setStatuses }}>
      {children}
    </RowStatusContext.Provider>
  );
}
