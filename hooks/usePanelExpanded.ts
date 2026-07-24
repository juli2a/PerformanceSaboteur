"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePanelExpandedStore } from "@/store/panel-expanded";
import { usePanelExpandedStoreUnstable } from "@/store/panel-expanded-unstable";

export const RESTORE_ANIMATION_DELAY_MS = 150;

// Case 2 toggle OFF (good path): cookie-backed, SSR-safe, see store/panel-expanded.ts. useSyncExternalStore's third argument is the snapshot used for SSR *and* the client's first hydration pass; passing initialExpanded (read from the cookie server-side) there means both renders agree from the start. PerformancePanel now takes part in real SSR/hydration once the isMobile cookie is set (context/MediaContext.tsx), so this actually fires as intended. But that snapshot only covers that first paint: the store's own `expanded` field is still its hardcoded `false` default until something writes to it, so the very next re-render for *any* reason would fall back to that stale `false` and visibly re-collapse. The effect seeds the store with the real value once, so there's nothing left to fall back to; it never runs on the server, so it can't leak across requests via the module-level store.
function useStableExpanded(initialExpanded: boolean) {
  const expanded = useSyncExternalStore(
    usePanelExpandedStore.subscribe,
    () => usePanelExpandedStore.getState().expanded,
    () => initialExpanded,
  );

  useEffect(() => {
    usePanelExpandedStore.setState({ expanded: initialExpanded });
  }, [initialExpanded]);

  return expanded;
}

// Case 2 toggle ON (bad path): plain zustand+persist read from localStorage, see store/panel-expanded-unstable.ts for why this is exactly the panel's original (buggy) implementation. The setTimeout below isn't part of that story, it's a second, unrelated shortcut stacked on top: it delays applying the corrected value by a guessed amount so the restore animation has something to transition from, rather than addressing why the animation had nothing to transition from in the first place (the corrected value was landing before the browser ever painted the initialExpanded state). The guessed delay is generous enough to always outlast the real gap on any device or deployment, so the mismatch it was never meant to fix ends up reliably visible anyway.
function useUnstableExpanded(initialExpanded: boolean) {
  const persisted = usePanelExpandedStoreUnstable((state) => state.expanded);
  const [displayed, setDisplayed] = useState(initialExpanded);

  useEffect(() => {
    // Give styles/DOM a moment to settle, otherwise the CSS transition
    // doesn't play on first render.
    const timer = setTimeout(
      () => setDisplayed(persisted),
      RESTORE_ANIMATION_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [persisted]);

  return displayed;
}

// Shared by PerformancePanelMobile. The toggle only picks which value above drives the display; everything else (subscribing, writing) is identical either way.
export function usePanelExpanded(
  isUnstable: boolean,
  initialExpanded: boolean,
) {
  const stable = useStableExpanded(initialExpanded);
  const unstable = useUnstableExpanded(initialExpanded);

  // Every click writes to *both* stores, no matter which one is currently driving the display, plus the cookie the good store's SSR read depends on (kept here rather than inside store/panel-expanded.ts, same split as hooks/useSidebarCollapsed.ts). The Case 2 toggle only demos which mechanism reads the value back (cookie vs localStorage-only); it shouldn't also make the user's actual expand/collapse preference diverge between the two, or switching the toggle would show a stale, unrelated value instead of the state you were just in.
  const setExpanded = (expanded: boolean) => {
    usePanelExpandedStore.getState().setExpanded(expanded);
    usePanelExpandedStoreUnstable.getState().setExpanded(expanded);
    document.cookie = `panelExpanded=${expanded ? "on" : "off"}; path=/; max-age=31536000`;
  };

  return {
    expanded: isUnstable ? unstable : stable,
    setExpanded,
  };
}
