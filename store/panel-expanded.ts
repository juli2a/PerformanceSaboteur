import { create } from "zustand";

interface PanelExpandedState {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

// Mobile performance panel's open/collapsed state, unrelated to the simulator, shared with hooks/usePanelExpanded.ts the same way store/sidebar.ts is. The store itself stays a plain state container; the cookie side effect that makes it SSR-safe lives in the hook. localStorage would only be visible to the client, forcing every load to start collapsed and animate-correct after mount (Case 2 / CLS demonstrates exactly that failure mode via store/panel-expanded-unstable.ts).
export const usePanelExpandedStore = create<PanelExpandedState>()((set) => ({
  expanded: false,
  setExpanded: (expanded) => set({ expanded }),
}));
