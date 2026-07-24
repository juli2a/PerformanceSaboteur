"use client";

import { useWebVitalsReporter } from "@/hooks/useWebVitalsReporter";
import { useBlockingTimeReporter } from "@/hooks/useBlockingTimeReporter";
import { useDomNodesReporter } from "@/hooks/useDomNodesReporter";
import { useInteractionLatencyReporter } from "@/hooks/useInteractionLatencyReporter";
import { useRerenderNodesReporter } from "@/hooks/useRerenderNodesReporter";
import { useClearAlertsOnNavigate } from "@/hooks/useClearAlertsOnNavigate";
import { useSyncSsrCookies } from "@/hooks/useSyncSsrCookies";
import { useSimControlStore } from "@/store/simulator-control";
import { ENV } from "@/lib/config";

// Case 6 (docs/case6.md): a text-child hydration mismatch throws synchronously *during* React's initial hydration pass, and Next.js reports it via the browser's global `reportError` in that same synchronous call stack, before any component's useEffect gets a chance to run. So this listener has to be registered at module-evaluation time (the whole client bundle evaluates before hydrateRoot is ever called), not inside a useEffect like the reporter hooks below, which would simply miss an event that fires during the very first hydration pass.
// Dev builds throw the full message below; production builds minify it to error #418, surfaced as a link to react.dev/errors/418 instead of readable text (re-check after any React/Next upgrade, minified codes can shift).
export const HYDRATION_MISMATCH_SIGNATURE_PROD = "react.dev/errors/418";
export const HYDRATION_MISMATCH_SIGNATURE_DEV =
  "Hydration failed because the server rendered";

const HYDRATION_MISMATCH_SIGNATURE =
  ENV === "production"
    ? HYDRATION_MISMATCH_SIGNATURE_PROD
    : HYDRATION_MISMATCH_SIGNATURE_DEV;

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const message = event.error?.message ?? event.message ?? "";
    if (message.includes(HYDRATION_MISMATCH_SIGNATURE)) {
      useSimControlStore.getState().triggerAlert("hydrationMismatch");
    }
  });
}

// Mounted once in the root layout, the one "use client" boundary for every side-effect-only hook that has no UI of its own: the PerformanceObserver reporters feeding the floating Performance Panel, plus SSR-cookie sync. None of these hooks render anything, so this never grows the fiber tree beyond this single boundary; adding another effect-only hook means calling it here, not adding a new component.
export default function SimulatorEffects() {
  useWebVitalsReporter();
  useBlockingTimeReporter();
  useDomNodesReporter();
  useInteractionLatencyReporter();
  useRerenderNodesReporter("contextOverhead", 1);
  useRerenderNodesReporter("brokenMemoization", 100);
  useClearAlertsOnNavigate();
  useSyncSsrCookies();

  return null;
}
