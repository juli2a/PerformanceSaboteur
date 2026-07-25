"use client";

import { useEffect, useRef } from "react";
import { useInventorySearchStore } from "@/store/inventory-search";
import { useSimControlStore } from "@/store/simulator-control";
import { useSimulatorCase } from "@/hooks/useSimulatorCase";

export const DEBOUNCE_MS = 300;

interface SearchResponse {
  ids: number[];
}

// Toggle OFF (good path): debounce the keystroke, then fire a single cancellable request; any earlier in-flight request is aborted before it can ever resolve, so a stale response can never reach state.
function runGoodPath(execute: (signal: AbortSignal) => void): () => void {
  const controller = new AbortController();
  const timer = setTimeout(() => execute(controller.signal), DEBOUNCE_MS);
  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}

// Toggle ON (bad path): fire on every keystroke immediately, with no debounce and no cancellation; responses can resolve out of order and a stale one can clobber a newer one, exactly the bug being demonstrated.
function runBadPath(execute: () => void): () => void {
  execute();
  return () => {};
}

// Drives the Inventory search request lifecycle (Case 4, Network race condition). The toggle only picks which path above runs; the request itself, and how its response gets applied (runSearch below), is identical either way.
export function useInventorySearch() {
  const query = useInventorySearchStore((state) => state.query);
  const setMatchedIds = useInventorySearchStore((state) => state.setMatchedIds);
  const setIsSearching = useInventorySearchStore(
    (state) => state.setIsSearching,
  );
  const setIsStale = useInventorySearchStore((state) => state.setIsStale);
  const isRaceConditionOn = useSimulatorCase("raceCondition");
  const triggerAlert = useSimControlStore((state) => state.triggerAlert);
  const closeAlert = useSimControlStore((state) => state.closeAlert);

  const latestSeqRef = useRef(0);
  const appliedSeqRef = useRef(0);

  useEffect(() => {
    if (!query.trim()) {
      setMatchedIds(null);
      setIsSearching(false);
      setIsStale(false);
      closeAlert("raceCondition");
      return;
    }

    const seq = ++latestSeqRef.current;

    async function runSearch(signal?: AbortSignal) {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/inventory-search?q=${encodeURIComponent(query)}`,
          { signal },
        );
        const data: SearchResponse = await res.json();

        if (seq < appliedSeqRef.current) {
          // Reachable only on the bad path, the good path's AbortController guarantees a stale request's response never lands here.
          setIsStale(true);
          triggerAlert("raceCondition");
        } else if (seq === latestSeqRef.current) {
          // This is the response for the most recently typed query, the display is correct again, clear any earlier race-condition alert.
          setIsStale(false);
          closeAlert("raceCondition");
        }
        appliedSeqRef.current = Math.max(appliedSeqRef.current, seq);
        setMatchedIds(new Set(data.ids));
      } catch (error) {
        if ((error as Error).name !== "AbortError") throw error;
      } finally {
        setIsSearching(false);
      }
    }

    return isRaceConditionOn ? runBadPath(runSearch) : runGoodPath(runSearch);
  }, [
    query,
    isRaceConditionOn,
    setMatchedIds,
    setIsSearching,
    setIsStale,
    triggerAlert,
    closeAlert,
  ]);
}
