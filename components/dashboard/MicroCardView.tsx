import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CopyButton } from "@/components/ui/copy-button";
import FlashOnUpdate from "@/components/simulator/FlashOnUpdate";

interface Props {
  id: string;
  title: string;
  sku: string;
  marginality: number;
  value: string;
  rating: number;
  sparklineData: number[];
  lowMargin: boolean;
}

// Shared visual markup for the KPI micro-card: both MicroCard (Case 8 good path) and MicroCardUnoptimized (Case 8 bad path) render through this component.
export default function MicroCardView({
  title,
  sku,
  marginality,
  value,
  rating,
  sparklineData,
  lowMargin,
}: Props) {
  const isGood = rating >= 4;

  return (
    <FlashOnUpdate caseKey="brokenMemoization">
      <Popover>
        <PopoverTrigger
          nativeButton={false}
          render={
            <Card
              disabled={lowMargin}
              data-low-margin={lowMargin}
              className={cn(
                "py-2.5 px-3",
                !lowMargin && "border-border-strong",
              )}
            />
          }
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-text-2">
              {title}
            </span>
            <span className="shrink-0 whitespace-nowrap rounded-xs border border-border bg-surface-2 px-1.5 py-0.5 text-sm font-semibold text-text-3">
              GM% {marginality}
            </span>
          </div>

          <div className="mt-2.5 flex items-end justify-between gap-2.5">
            <div>
              <p className="tabular-nums text-lg font-semibold tracking-tight text-foreground">
                {value}
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                <span
                  className={cn(
                    "text-[11px] leading-none",
                    isGood ? "text-pos" : "text-alert",
                  )}
                >
                  ★
                </span>
                <span className="tabular-nums text-sm font-semibold text-foreground">
                  {rating.toFixed(1)}
                </span>
              </div>
            </div>
            <Sparkline
              data={sparklineData}
              className="w-[92px] h-[30px] @min-[1024px]:w-[50px] @min-[1024px]:h-[17px] @min-[1360px]:w-[92px] @min-[1360px]:h-[30px]"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent sideOffset={-40}>
          <p className="font-medium text-foreground text-lg">{title}</p>
          <div className="mt-1 flex items-center gap-1 text-text-3">
            <span>SKU {sku}</span>
            <CopyButton value={sku} label="SKU" />
          </div>
        </PopoverContent>
      </Popover>
    </FlashOnUpdate>
  );
}
