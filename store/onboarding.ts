import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { OnboardingState } from "@/types/simulator";

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      controlSeen: true,
      guideSeen: true,
      codeSeen: true,
      markControlSeen: () =>
        set((state) => (state.controlSeen ? state : { controlSeen: true })),
      markGuideSeen: () =>
        set((state) => (state.guideSeen ? state : { guideSeen: true })),
      markCodeSeen: () =>
        set((state) => (state.codeSeen ? state : { codeSeen: true })),
    }),
    {
      name: "simulator-onboarding",
      // `persistedState` is undefined only when this browser has never written this key before, a genuine first visit: start the onboarding sequence (all three false) instead of keeping the "already seen" default above, which exists purely to avoid flashing the pulse on every reload for a returning visitor while this middleware is still reading localStorage.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as
          Partial<OnboardingState> | undefined;
        if (!persisted) {
          return {
            ...currentState,
            controlSeen: false,
            guideSeen: false,
            codeSeen: false,
          };
        }
        return { ...currentState, ...persisted };
      },
    },
  ),
);
