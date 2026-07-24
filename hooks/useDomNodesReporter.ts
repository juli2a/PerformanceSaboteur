import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useSimPerformanceStore } from "@/store/simulator-performance";

const SETTLE_DELAY_MS = 150;

// Called once from SimulatorEffects. A single snapshot on navigation would race the Dashboard's staggered Suspense streaming (each section resolves at a different delay, see lib/server/dashboard.ts) and land on whatever happened to be in the DOM at that instant. Instead, this watches the page live via MutationObserver and recomputes after each burst of mutations settles, so the count converges to the real total (and stays accurate through any case toggle that changes the DOM, e.g. Case 3 Heavy Mounting) rather than reporting a stale mid-stream snapshot.
export function useDomNodesReporter() {
  const setDomNodes = useSimPerformanceStore((state) => state.setDomNodes);
  const pathname = usePathname();

  useEffect(() => {
    setDomNodes(document.querySelectorAll("*").length);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setDomNodes(document.querySelectorAll("*").length);
      }, SETTLE_DELAY_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname, setDomNodes]);
}
