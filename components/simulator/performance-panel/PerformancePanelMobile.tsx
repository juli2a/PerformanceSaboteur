"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { getRatingPresentation } from "@/lib/utils/gauge";
import { METRIC_TOOLTIPS, VITAL_DOCS_URL } from "@/lib/simulator-thresholds";
import { usePanelExpanded } from "@/hooks/usePanelExpanded";
import { useSimControlStore } from "@/store/simulator-control";
import { useSimPerformanceStore } from "@/store/simulator-performance";
import OverallRatingBadge from "@/components/simulator/performance-panel/OverallRatingBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipInfoTrigger,
} from "@/components/ui/tooltip";
import type { PerformancePanelMetrics } from "@/components/simulator/performance-panel/panel-metrics";
import type { VitalRating } from "@/types/simulator";

interface MetricPreview {
  label: string;
  display: string;
  rating: VitalRating | null;
  href?: string;
  // Short explainer shown via an info icon next to the label, only the three custom metrics (DOM nodes, Blocking Time, Interaction Latency) have one, see METRIC_TOOLTIPS in lib/simulator-thresholds.ts.
  tooltip?: string;
}

function RatingDot({ rating }: { rating: VitalRating | null }) {
  return (
    <span
      className="size-1.5 shrink-0 rounded-full"
      style={{
        background: rating
          ? getRatingPresentation(rating).color
          : "var(--brand-muted)",
      }}
    />
  );
}

// "Chart-free" metric for the expanded grid: a coloured number, no gauge ring (no room for SVG rings at this width).
function VitalReadout({ label, display, rating, href }: MetricPreview) {
  const labelClass =
    "text-[15px] font-semibold underline tracking-wide text-brand-muted";

  return (
    <div className="flex flex-1 items-baseline justify-center gap-1.5">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(labelClass, "hover:text-brand-text")}
        >
          {label}
        </a>
      ) : (
        <span className={labelClass}>{label}</span>
      )}
      <span
        className={cn(
          "font-bold tabular-nums",
          rating ? getRatingPresentation(rating).textClass : "text-brand-text",
        )}
      >
        {display}
      </span>
    </div>
  );
}

function StatTile({ label, display, rating, tooltip }: MetricPreview) {
  return (
    <div className="flex flex-1 items-center justify-between gap-2 rounded-xs border border-brand-border bg-brand-bg-2 px-2.75 py-1">
      <span className="whitespace-nowrap text-sm text-brand-muted">
        {tooltip ? (
          <Tooltip>
            <TooltipInfoTrigger
              label={`What is ${label}?`}
              color="brand"
              iconSize={18}
            >
              {label}
            </TooltipInfoTrigger>
            <TooltipContent color="brand">{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          label
        )}
      </span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          rating ? getRatingPresentation(rating).textClass : "text-brand-text",
        )}
      >
        {display}
      </span>
    </div>
  );
}

// Bottom panel, mobile counterpart to PerformancePanelDesktop's floating corner widget. Receives the metrics PerformancePanel computed once for both branches; owns only its own mobile-only UI state (expanded/collapsed, panel height for positioning the alert lane above it).
export default function PerformancePanelMobile({
  alerts,
  vitals,
  domNodes,
  blockingTime,
  blockingTimeRating,
  interactionLatency,
  interactionLatencyRating,
  overallRating,
  isLayoutShiftOn,
  initialExpanded,
}: PerformancePanelMetrics & {
  isLayoutShiftOn: boolean;
  initialExpanded: boolean;
}) {
  const controlsOpen = useSimControlStore((state) => state.controlsOpen);
  const panelHeight = useSimPerformanceStore(
    (state) => state.mobilePanelHeight,
  );
  const setMobilePanelHeight = useSimPerformanceStore(
    (state) => state.setMobilePanelHeight,
  );

  // Case 2 (Layout Shift) mobile branch point, see PanelAnchor.tsx.
  const { expanded, setExpanded } = usePanelExpanded(
    isLayoutShiftOn,
    initialExpanded,
  );

  // Forced open while the simulator controls sheet is open, so a reader can never lose sight of the metrics they're about to toggle.
  const open = expanded || controlsOpen;

  // Measures the panel's own height into the store: the alert lane below floats its fixed bottom offset just above it, and MobileControlDrawer reserves the same amount of bottom padding in its own scroll area, giving a single source of truth for "how tall is the panel right now". A ResizeObserver catches every cause of a height change: open/alerts.length toggling, but also less obvious ones like the stat-tile row wrapping to a second line on a narrower viewport.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    // Mirrors the same measurement into a CSS var on the document root, which `main` (app/(shell)/layout.tsx) reads directly to reserve bottom padding for this now fixed-position panel.
    const observer = new ResizeObserver(() => {
      setMobilePanelHeight(el.offsetHeight);
      document.documentElement.style.setProperty(
        "--mobile-panel-h",
        `${el.offsetHeight}px`,
      );
    });
    observer.observe(el);
    // Zero it back out on unmount (e.g. switching to desktop, where PerformancePanelDesktop takes over instead); otherwise consumers like MobileDrawer keep reserving space for a panel that's no longer in the DOM, going by whatever height this one last measured.
    return () => {
      observer.disconnect();
      setMobilePanelHeight(0);
      document.documentElement.style.setProperty("--mobile-panel-h", "0px");
    };
  }, [setMobilePanelHeight]);

  const lcp: MetricPreview = {
    label: "LCP",
    display: vitals.lcp ? `${(vitals.lcp.value / 1000).toFixed(1)}s` : "—",
    rating: vitals.lcp?.rating ?? null,
    href: VITAL_DOCS_URL.lcp,
  };
  const cls: MetricPreview = {
    label: "CLS",
    display: vitals.cls ? vitals.cls.value.toFixed(2) : "—",
    rating: vitals.cls?.rating ?? null,
    href: VITAL_DOCS_URL.cls,
  };
  const inp: MetricPreview = {
    label: "INP",
    display: vitals.inp ? `${Math.round(vitals.inp.value)}ms` : "—",
    rating: vitals.inp?.rating ?? null,
    href: VITAL_DOCS_URL.inp,
  };
  return (
    <div>
      {alerts.length > 0 && (
        <div
          className="fixed inset-x-3 z-45 flex flex-col gap-2"
          style={{ bottom: panelHeight + 12 }}
        >
          {alerts}
        </div>
      )}
      <div
        ref={panelRef}
        className="sim-panel-mobile fixed inset-x-0 bottom-0 z-60"
      >
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          disabled={controlsOpen}
          aria-expanded={open}
          aria-label={
            open ? "Collapse Performance Panel" : "Expand Performance Panel"
          }
          className="flex h-12.5 w-full items-center justify-between px-4 disabled:cursor-default"
        >
          <span className="flex items-center gap-1.75 text-[13px] font-semibold text-brand-text">
            <span className="heading-brand-kicker">SIMULATOR</span>
            Web Vitals
          </span>
          <span className="flex items-center gap-3">
            {open ? (
              <OverallRatingBadge rating={overallRating} />
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-xs text-brand-muted">
                  <RatingDot rating={lcp.rating} />
                  {lcp.label} {lcp.display}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-brand-muted">
                  <RatingDot rating={inp.rating} />
                  {inp.label} {inp.display}
                </span>
              </>
            )}
            {!controlsOpen && (
              <ChevronDown
                size={14}
                className={cn(
                  "text-brand-muted transition-transform",
                  open && "rotate-180",
                )}
              />
            )}
          </span>
        </button>
        <div
          className="sim-panel-mobile-content"
          data-panel-open={open || undefined}
          data-instant={controlsOpen || undefined}
        >
          <div className="sim-panel-mobile-content-row flex flex-col gap-2.75 px-4">
            <div className="flex gap-2 py-1.5">
              <VitalReadout {...lcp} />
              <VitalReadout {...cls} />
              <VitalReadout {...inp} />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-brand-border pt-2.75 pb-3.5">
              <StatTile
                label="DOM nodes"
                display={domNodes === null ? "—" : formatNumber(domNodes)}
                rating={null}
                tooltip={METRIC_TOOLTIPS.domNodes}
              />
              <StatTile
                label="Blocking Time"
                display={`${blockingTime}ms`}
                rating={blockingTimeRating}
                tooltip={METRIC_TOOLTIPS.blockingTime}
              />
              <StatTile
                label="Interaction Latency"
                display={`${interactionLatency}ms`}
                rating={interactionLatencyRating}
                tooltip={METRIC_TOOLTIPS.interactionLatency}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
