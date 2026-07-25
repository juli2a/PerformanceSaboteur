import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CaseKey, SimControlState } from "@/types/simulator";

// Cases whose anti-pattern must be visible in the server-rendered HTML itself (the metric they degrade, LCP, is only measured on a real navigation, never on an in-place client update). Their toggle state lives in a cookie instead of localStorage: Server Components read the cookie directly, and the store below seeds from that same cookie at creation, so there's no separate async rehydration step that could race a real user toggle. Every other case is pure client-side live demonstration (flip the switch, watch the already-mounted React tree degrade); those stay in localStorage via `persist`, since cookies don't give free reactivity.
export const SSR_COOKIE_CASES: readonly CaseKey[] = [
  "imageOptimization",
  "layoutShift",
  "waterfall",
  "hydrationMismatch",
];

const DEFAULT_TOGGLES: Record<CaseKey, boolean> = {
  imageOptimization: false,
  layoutShift: false,
  heavyMounting: false,
  raceCondition: false,
  waterfall: false,
  hydrationMismatch: false,
  contextOverhead: false,
  brokenMemoization: false,
};

// Only `toggles` is persisted, survives refresh. Guide and alert state are transient UI state, not something that should survive a refresh. SSR_COOKIE_CASES keys are stripped out of the persisted blob (their source of truth is the cookie, not localStorage) and restored via `merge` from the cookie-seeded initial state above, never from the stored blob.
export const useSimControlStore = create<SimControlState>()(
  persist(
    (set) => ({
      toggles: DEFAULT_TOGGLES,
      setToggle: (key, value) =>
        set((state) => ({ toggles: { ...state.toggles, [key]: value } })),
      resetToggles: () => set({ toggles: DEFAULT_TOGGLES }),
      activeGuideKey: null,
      setActiveGuide: (key) => set({ activeGuideKey: key }),
      controlsOpen: false,
      setControlsOpen: (open) => set({ controlsOpen: open }),
      caseAlerts: {},
      triggerAlert: (key) =>
        set((state) =>
          state.caseAlerts[key] === "shown"
            ? state
            : { caseAlerts: { ...state.caseAlerts, [key]: "shown" } },
        ),
      // User explicitly closed it, recorded as "dismissed" so we know this occurrence was seen, not just forgotten.
      dismissAlert: (key) =>
        set((state) => ({
          caseAlerts: { ...state.caseAlerts, [key]: "dismissed" },
        })),
      // The case's own trigger condition resolved on its own; nothing was actually dismissed, so the key is removed entirely (back to the never-triggered baseline) rather than marked "dismissed".
      closeAlert: (key) =>
        set((state) => {
          const caseAlerts = { ...state.caseAlerts };
          delete caseAlerts[key];
          return { caseAlerts };
        }),
      clearAlerts: () => set({ caseAlerts: {} }),
    }),
    {
      name: "simulator-cases",
      partialize: (state) => ({
        toggles: Object.fromEntries(
          Object.entries(state.toggles).filter(
            ([key]) => !SSR_COOKIE_CASES.includes(key as CaseKey),
          ),
        ) as Record<CaseKey, boolean>,
      }),
      // Default merge would replace `toggles` wholesale with the persisted (partialized) blob, wiping the cookie-seeded SSR_COOKIE_CASES values since they were never in that blob. Merge field-by-field instead so those keys keep coming from the cookie-seeded initial state, and only the localStorage-backed keys come from the stored blob.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as
          Partial<SimControlState> | undefined;
        return {
          ...currentState,
          ...persisted,
          toggles: { ...currentState.toggles, ...persisted?.toggles },
        };
      },
    },
  ),
);
