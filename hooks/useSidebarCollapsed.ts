"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSidebarStore } from "@/store/sidebar";
import { useSidebarStoreUnstable } from "@/store/sidebar-unstable";

// Case 2 toggle OFF (good path): cookie-backed, SSR-safe, see store/sidebar.ts. useSyncExternalStore's third argument is the snapshot used for SSR *and* the client's first hydration pass; passing initialCollapsed (read from the cookie server-side) there means both renders agree from the start. But that snapshot only covers that first paint: the store's own `collapsed` field is still its hardcoded `false` default until something writes to it, so the very next re-render for *any* reason (unrelated state change elsewhere in the tree, a Fast-Refresh, etc.) would fall back to that stale `false` and visibly re-expand. The effect seeds the store with the real value once, so there's nothing left to fall back to.
function useStableCollapsed(initialCollapsed: boolean) {
  const collapsed = useSyncExternalStore(
    useSidebarStore.subscribe,
    () => useSidebarStore.getState().collapsed,
    () => initialCollapsed,
  );

  useEffect(() => {
    useSidebarStore.setState({ collapsed: initialCollapsed });
  }, [initialCollapsed]);

  return collapsed;
}

// Case 2 toggle ON (bad path): plain zustand+persist read from localStorage, see store/sidebar-unstable.ts for why this is exactly the sidebar's original (buggy) implementation.
function useUnstableCollapsed() {
  return useSidebarStoreUnstable((state) => state.collapsed);
}

// Shared by Header/Sidebar/MainNav. The toggle only picks which value above drives the display; everything else (subscribing, writing) is identical either way.
export function useSidebarCollapsed(
  isUnstable: boolean,
  initialCollapsed: boolean,
) {
  const stable = useStableCollapsed(initialCollapsed);
  const unstable = useUnstableCollapsed();

  // Every click writes to *both* stores, no matter which one is currently driving the display, plus the cookie the good store's SSR read depends on (kept here rather than inside store/sidebar.ts, same split as useToggleCase keeps useSimControlStore's setToggle pure). The Case 2 toggle only demos which mechanism reads the value back (cookie vs localStorage-only); it shouldn't also make the user's actual collapse/expand preference diverge between the two, or switching the toggle would show a stale, unrelated value instead of the state you were just in.
  const setCollapsed = (collapsed: boolean) => {
    useSidebarStore.getState().setCollapsed(collapsed);
    useSidebarStoreUnstable.getState().setCollapsed(collapsed);
    document.cookie = `sidebarCollapsed=${collapsed ? "on" : "off"}; path=/; max-age=31536000`;
  };

  return {
    collapsed: isUnstable ? unstable : stable,
    setCollapsed,
  };
}
