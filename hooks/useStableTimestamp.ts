"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// Case 6 toggle OFF (good path, docs/case6.md): render deferred until after mount, so the server and the client's first paint agree ("..."), nothing left to mismatch against once the real value appears. useSyncExternalStore's getServerSnapshot only ever runs for the SSR pass and the client's first hydration pass; returning `false` there and `true` for every render after gives a one-time "mounted" flip without calling setState inside an effect (same shape as hooks/useSidebarCollapsed.ts's useStableCollapsed).
export function useStableTimestamp(): string {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  return mounted ? new Date().toLocaleTimeString("en-US") : "...";
}
