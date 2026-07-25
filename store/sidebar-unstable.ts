import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

// Case 2 (Layout Shift) "bad" path: the sidebar's original persistence model, localStorage only, no cookie, no SSR awareness. The server always renders collapsed=false; zustand's persist middleware deliberately skips synchronous rehydration on the first client render (to avoid a hydration warning), so that first render matches the server too. Once mounted, the store updates to the real localStorage value via an ordinary setState; no React warning, just a plain state change animated by the sidebar's own transition-[width], which is exactly the layout shift this case measures.
export const useSidebarStoreUnstable = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    {
      name: "sidebar-collapsed-unstable",
    },
  ),
);
