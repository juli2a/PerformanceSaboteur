"use client";

import {
  SSR_COOKIE_CASES,
  useSimControlStore,
} from "@/store/simulator-control";

// Backs the control panel's "All off" button. Doesn't just loop useToggleCase(key, false) over every active case, that would call window.location.reload() once per active SSR_COOKIE_CASES case. Instead: one store reset, one batch of cookie writes, and at most one reload.
export function useResetAllToggles() {
  const toggles = useSimControlStore((state) => state.toggles);
  const resetToggles = useSimControlStore((state) => state.resetToggles);

  return () => {
    const activeSsrCases = SSR_COOKIE_CASES.filter((key) => toggles[key]);
    resetToggles();
    if (activeSsrCases.length === 0) return;
    activeSsrCases.forEach((key) => {
      document.cookie = `${key}=off; path=/; max-age=31536000`;
    });
    window.location.reload();
  };
}
