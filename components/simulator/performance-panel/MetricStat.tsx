import { getRatingPresentation } from "@/lib/utils/gauge";
import { cn } from "@/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipInfoTrigger,
} from "@/components/ui/tooltip";
import type { VitalRating } from "@/types/simulator";

interface MetricStatProps {
  label: string;
  value: string;
  // Omit for ungraded stats (e.g. DOM nodes, there's no absolute "good" node count, it depends entirely on the dataset).
  rating?: VitalRating;
  // Short explainer shown via an info icon next to the label, only the three custom metrics (DOM nodes, Blocking Time, Interaction Latency) have one, see METRIC_TOOLTIPS in lib/simulator-thresholds.ts.
  tooltip?: string;
}

export default function MetricStat({
  label,
  value,
  rating,
  tooltip,
}: MetricStatProps) {
  return (
    <div>
      <p className="text-sm text-text-3 whitespace-nowrap">
        {tooltip ? (
          <Tooltip>
            <TooltipInfoTrigger label={`What is ${label}?`} color="brand">
              {label}
            </TooltipInfoTrigger>
            <TooltipContent color="brand">{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          label
        )}
      </p>
      <p
        className={cn(
          "text-[15px] font-semibold tabular-nums",
          rating ? getRatingPresentation(rating).textClass : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
