"use client";

import { useEffect } from "react";
import {
  SSR_COOKIE_CASES,
  useSimControlStore,
} from "@/store/simulator-control";

// The store always seeds SSR_COOKIE_CASES toggles to `false` (a safe server default); on mount, realign each one from its actual cookie. The relevant Server Component already rendered the right variant straight from the cookie, so this only corrects the toggle UI; no reload needed here (that only happens on a genuine user click, see useToggleCase).
export function useSyncSsrCookies() {
  useEffect(() => {
    const { toggles, setToggle } = useSimControlStore.getState();
    for (const key of SSR_COOKIE_CASES) {
      const cookieIsOn = document.cookie.includes(`${key}=on`);
      if (cookieIsOn !== toggles[key]) {
        setToggle(key, cookieIsOn);
      }
    }
  }, []);
}
