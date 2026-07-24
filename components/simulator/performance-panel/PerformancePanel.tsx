"use client";

import {
  BLOCKING_TIME_GOOD,
  BLOCKING_TIME_POOR,
  INP_GOOD,
  INP_POOR,
} from "@/lib/simulator-thresholds";
import { getSimulatorCase } from "@/lib/simulator-cases";
import { getOverallRating, getValueRating } from "@/lib/utils/gauge";
import { useContext } from "react";
import { MediaContext } from "@/context/MediaContext";
import { useSimControlStore } from "@/store/simulator-control";
import { useSimPerformanceStore } from "@/store/simulator-performance";
import PerformancePanelDesktop from "@/components/simulator/performance-panel/PerformancePanelDesktop";
import PerformancePanelMobile from "@/components/simulator/performance-panel/PerformancePanelMobile";
import SimulatorAlert from "@/components/simulator/performance-panel/SimulatorAlert";
import type { CaseKey } from "@/types/simulator";

// Computes the metrics shared by both surfaces, PerformancePanelDesktop (floating corner widget) and PerformancePanelMobile (bottom panel, per docs/ui.md "Floating Performance Panel" → Mobile), and picks which one to render. Neither child re-reads these stores itself, so there's a single source of truth for what's "Good"/"Degraded"/"Poor" everywhere. domNodes/blockingTime/interactionLatency are written elsewhere (the useDomNodesReporter/useBlockingTimeReporter/useInteractionLatencyReporter hooks, all called from SimulatorEffects in the root layout); this component only reads the store, it doesn't measure anything itself.
interface Props {
  isLayoutShiftOn: boolean;
  initialExpanded: boolean;
  initialIsMobile: boolean | undefined;
}

export default function PerformancePanel({
  isLayoutShiftOn,
  initialExpanded,
  initialIsMobile,
}: Props) {
  // Falls back to the cookie-seeded server guess until MediaContext's own matchMedia resolves, see context/MediaContext.tsx for why, and docs/case2.md for what this unblocks (SSR for this component).
  const isMobile = useContext(MediaContext) ?? initialIsMobile;
  const caseAlerts = useSimControlStore((state) => state.caseAlerts);
  const dismissAlert = useSimControlStore((state) => state.dismissAlert);
  const shownAlertKeys = (Object.keys(caseAlerts) as CaseKey[]).filter(
    (key) => caseAlerts[key] === "shown",
  );

  const vitals = useSimPerformanceStore((state) => state.vitals);
  const domNodes = useSimPerformanceStore((state) => state.domNodes);
  const blockingTime = useSimPerformanceStore((state) => state.blockingTime);
  const interactionLatency = useSimPerformanceStore(
    (state) => state.interactionLatency,
  );
  const rerenderedNodes = useSimPerformanceStore(
    (state) => state.rerenderedNodes,
  );

  const overallRating = getOverallRating([
    vitals.lcp?.rating ?? null,
    vitals.cls?.rating ?? null,
    vitals.inp?.rating ?? null,
  ]);
  const blockingTimeRating = getValueRating(
    blockingTime,
    BLOCKING_TIME_GOOD,
    BLOCKING_TIME_POOR,
  );
  const interactionLatencyRating = getValueRating(
    interactionLatency,
    INP_GOOD,
    INP_POOR,
  );

  const alerts = shownAlertKeys.map((key) => {
    const { title, body } = getSimulatorCase(key).alert;
    // Case 7's and Case 8's alert.body are static prefixes; the live settle-window count (see hooks/useRerenderNodesReporter.ts) is appended here at render time rather than baked into the case definition. rerenderedNodes is keyed by case so one case's stale count never leaks into the other's alert body.
    const displayBody =
      (key === "contextOverhead" || key === "brokenMemoization") &&
      rerenderedNodes[key] != null
        ? `${body}: ${rerenderedNodes[key]}`
        : body;
    return (
      <SimulatorAlert
        key={key}
        title={title}
        body={displayBody}
        onDismiss={() => dismissAlert(key)}
      />
    );
  });

  const metrics = {
    alerts,
    vitals,
    domNodes,
    blockingTime,
    blockingTimeRating,
    interactionLatency,
    interactionLatencyRating,
    overallRating,
  };

  if (isMobile === undefined) return null;

  return isMobile ? (
    <PerformancePanelMobile
      {...metrics}
      isLayoutShiftOn={isLayoutShiftOn}
      initialExpanded={initialExpanded}
    />
  ) : (
    <PerformancePanelDesktop {...metrics} />
  );
}
