import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PanelExpandedState {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

// Case 2 (Layout Shift) "bad" path: the mobile panel's original persistence model, localStorage only, no cookie, no SSR awareness. The server always renders expanded=false. zustand's persist middleware actually rehydrates from localStorage synchronously, at store-creation time (see node_modules/zustand/esm/middleware.mjs), not via a later setState after mount. The visible "later" correction comes from useSyncExternalStore itself: it renders getServerSnapshot() on the first client pass to match SSR, then picks up the store's already-hydrated value once mounted. hooks/usePanelExpanded.ts deliberately widens that gap instead of leaving it to hydration timing alone (too fast to reliably grow the fixed, bottom-anchored panel in place on every deployment).
export const usePanelExpandedStoreUnstable = create<PanelExpandedState>()(
  persist(
    (set) => ({
      expanded: false,
      setExpanded: (expanded) => set({ expanded }),
    }),
    {
      name: "panel-expanded-unstable",
    },
  ),
);
