"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(query: string, callback: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

// undefined on the server / before hydration, lets SSR-safe consumers (e.g. MediaContext) tell "not yet known" apart from a real false match.
export function useMediaQuery(query: string) {
  // Stable per query, an inline subscribe would make React resubscribe on every render.
  const subscribeToQuery = useCallback(
    (callback: () => void) => subscribe(query, callback),
    [query],
  );

  return useSyncExternalStore(
    subscribeToQuery,
    () => window.matchMedia(query).matches,
    () => undefined,
  );
}
