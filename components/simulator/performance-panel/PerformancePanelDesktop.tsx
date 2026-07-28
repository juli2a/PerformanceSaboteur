import {
  CLS_POOR,
  INP_POOR,
  LCP_POOR,
  METRIC_TOOLTIPS,
  VITAL_DOCS_URL,
} from "@/lib/simulator-thresholds";
import { formatNumber } from "@/lib/utils/format";
import MetricGauge from "@/components/simulator/performance-panel/MetricGauge";
import MetricStat from "@/components/simulator/performance-panel/MetricStat";
import OverallRatingBadge from "@/components/simulator/performance-panel/OverallRatingBadge";
import type { PerformancePanelMetrics } from "@/components/simulator/performance-panel/panel-metrics";

// Floating corner widget, desktop counterpart to PerformancePanelMobile's bottom panel. Receives the metrics PerformancePanel computed once for both branches; renders them as gauge rings instead of chart-free numbers.
export default function PerformancePanelDesktop({
  alerts,
  vitals,
  domNodes,
  blockingTime,
  blockingTimeRating,
  interactionLatency,
  interactionLatencyRating,
  overallRating,
}: PerformancePanelMetrics) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[470px] flex-col gap-2.5">
      {alerts}
      <aside className="sim-card h-36.5 flex-col items-stretch justify-between gap-3 text-brand-text">
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex min-w-0 items-center gap-1.75">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent shadow-[0_0_8px_var(--brand-accent)]" />
            <span className="heading-brand-kicker">SIMULATOR</span>
            <span className="whitespace-nowrap text-[12px] font-semibold text-foreground">
              · Core Web Vitals
            </span>
          </span>
          <OverallRatingBadge rating={overallRating} className="shrink-0" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-3.5">
            <MetricGauge
              label="LCP"
              display={
                vitals.lcp ? `${(vitals.lcp.value / 1000).toFixed(1)}s` : "—"
              }
              value={vitals.lcp?.value ?? 0}
              poorThreshold={LCP_POOR}
              rating={vitals.lcp?.rating ?? null}
              href={VITAL_DOCS_URL.lcp}
            />
            <MetricGauge
              label="CLS"
              display={vitals.cls ? vitals.cls.value.toFixed(2) : "—"}
              value={vitals.cls?.value ?? 0}
              poorThreshold={CLS_POOR}
              rating={vitals.cls?.rating ?? null}
              href={VITAL_DOCS_URL.cls}
            />
            <MetricGauge
              label="INP ms"
              display={vitals.inp ? `${Math.round(vitals.inp.value)}` : "—"}
              value={vitals.inp?.value ?? 0}
              poorThreshold={INP_POOR}
              rating={vitals.inp?.rating ?? null}
              href={VITAL_DOCS_URL.inp}
            />
          </div>
          <span className="mx-2.5 w-px self-stretch bg-border" />
          <div className="flex flex-wrap justify-between flex-1 gap-x-3 gap-y-1">
            <MetricStat
              label="DOM nodes"
              value={domNodes === null ? "—" : formatNumber(domNodes)}
              tooltip={METRIC_TOOLTIPS.domNodes}
            />
            <MetricStat
              label="Blocking Time"
              value={`${blockingTime}ms`}
              rating={blockingTimeRating}
              tooltip={METRIC_TOOLTIPS.blockingTime}
            />
            <MetricStat
              label="Interaction Latency"
              value={`${interactionLatency}ms`}
              rating={interactionLatencyRating}
              tooltip={METRIC_TOOLTIPS.interactionLatency}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
