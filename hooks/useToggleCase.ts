"use client";

import {
  SSR_COOKIE_CASES,
  useSimControlStore,
} from "@/store/simulator-control";
import type { CaseKey } from "@/types/simulator";

// Every toggle click (desktop switch, mobile switch, guide's "Try it" button) goes through this instead of calling setToggle directly: keeps the SSR_COOKIE_CASES cookie+reload side effect in one place instead of a per-call-site check, and out of the store itself (setToggle stays a plain state transition, safe to call from anywhere without surprise reloads).
export function useToggleCase() {
  const setToggle = useSimControlStore((state) => state.setToggle);

  return (key: CaseKey, value: boolean) => {
    setToggle(key, value);
    if (SSR_COOKIE_CASES.includes(key)) {
      document.cookie = `${key}=${value ? "on" : "off"}; path=/; max-age=31536000`;
      window.location.reload();
    }
  };
}
