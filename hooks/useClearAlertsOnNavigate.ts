import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useSimControlStore } from "@/store/simulator-control";

// Called once from SimulatorEffects: a case's alert only makes sense on the page that demonstrates it, but the store it lives in (and the panel that renders it) both sit above the shell's {children}, so they survive navigation on their own. Clears every shown alert on each pathname change so one page's alert doesn't keep following the user onto another.
//
// Tracks the previous pathname in a ref (seeded with the current one) rather than clearing unconditionally on every effect run: an SSR-cookie case (e.g. Case 6, Hydration Mismatch) can trigger its alert synchronously during this same page's initial hydration, before this effect ever runs; clearing on that first run would wipe the alert it was meant to survive for. Comparing against the previous pathname also survives React Strict Mode's dev-only double effect invocation (mount → cleanup → mount), where a plain "first run" boolean would flip back and clear on the second call.
export function useClearAlertsOnNavigate() {
  const pathname = usePathname();
  const clearAlerts = useSimControlStore((state) => state.clearAlerts);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    clearAlerts();
  }, [pathname, clearAlerts]);
}
