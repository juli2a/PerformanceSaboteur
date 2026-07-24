import { getRatingPresentation } from "@/lib/utils/gauge";
import { cn } from "@/lib/utils/cn";
import type { VitalRating } from "@/types/simulator";

interface MetricStatProps {
  label: string;
  value: string;
  // Omit for ungraded stats (e.g. DOM nodes, there's no absolute "good" node count, it depends entirely on the dataset).
  rating?: VitalRating;
}

export default function MetricStat({ label, value, rating }: MetricStatProps) {
  return (
    <div>
      <p className="text-sm text-text-3 whitespace-nowrap">{label}</p>
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
