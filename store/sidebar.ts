import { create } from "zustand";

interface SidebarState {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

// Left workspace sidebar collapse state, unrelated to the simulator, shared between Header (logo zone width) and Sidebar without prop drilling through the shell layout. The store itself stays a plain state container; the cookie side effect that makes it SSR-safe lives in hooks/useSidebarCollapsed.ts, same split as useToggleCase keeps useSimControlStore's setToggle pure and does its own cookie write in the hook. localStorage would only be visible to the client, forcing every load to start collapsed=false and animate-correct after mount (Case 2 / CLS demonstrates exactly that failure mode via store/sidebar-unstable.ts).
export const useSidebarStore = create<SidebarState>()((set) => ({
  collapsed: false,
  setCollapsed: (collapsed) => set({ collapsed }),
}));
