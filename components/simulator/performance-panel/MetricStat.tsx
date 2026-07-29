import { getRatingPresentation } from "@/lib/utils/gauge";
import { cn } from "@/lib/utils/cn";
import {
  Popover,
  PopoverContent,
  PopoverInfoTrigger,
} from "@/components/ui/popover";
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
          <Popover>
            <PopoverInfoTrigger
              label={`What is ${label}?`}
              color="brand"
              openOnHover
              delay={100}
            >
              {label}
            </PopoverInfoTrigger>
            <PopoverContent color="brand" size="hint">
              {tooltip}
            </PopoverContent>
          </Popover>
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
