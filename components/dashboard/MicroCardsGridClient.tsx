"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyticCardData } from "@/types/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { processSparklineHistory } from "@/lib/utils/sparkline-processing";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useSimulatorCase } from "@/hooks/useSimulatorCase";
import { useRenderCounterStore } from "@/store/render-counter";
import MicroCard from "@/components/dashboard/MicroCard";
import MicroCardUnoptimized from "@/components/dashboard/MicroCardUnoptimized";

interface Props {
  products: AnalyticCardData[];
}

export function MicroCardsGridClient({ products }: Props) {
  const [threshold, setThreshold] = useState(10);
  const isBrokenMemoizationOn = useSimulatorCase("brokenMemoization");
  const startTrackingIfIdle = useRenderCounterStore(
    (state) => state.startTrackingIfIdle,
  );

  // Cleans, smooths and downsamples each product's year of raw daily readings once, `products` is a stable reference (a prop from the server, unaffected by the threshold slider), so this never reruns while the user drags "Min GM%". Contrast with MicroCardUnoptimized's bad-path version of this same pipeline, which reruns per card on every tick.
  const sparklines = useMemo(
    () => products.map((p) => processSparklineHistory(p.rawHistory)),
    [products],
  );

  useEffect(() => {
    console.log("[Stream] MicroCardsGrid mounted at", new Date().toISOString());
  }, []);

  const activeCount = products.filter((p) => p.marginality >= threshold).length;

  return (
    <Card variant="global" data-section="analytics-grid">
      <div className="mb-heading-gap flex flex-col gap-3 @min-[640px]:flex-row @min-[640px]:items-center">
        <div className="flex items-center justify-between @max-[340px]:flex-col @max-[340px]:items-start @max-[340px]:gap-1 @min-[640px]:contents">
          <h2 className="heading-2">Analytics Grid</h2>
          <span className="tabular-nums text-text-3 @min-[640px]:ml-auto">
            <span className="font-semibold text-foreground">{activeCount}</span>
            <span> / {products.length}</span>
          </span>
        </div>
        <div className="flex items-center justify-end gap-3 text-text-3">
          <span>Min GM%</span>
          <Slider
            min={0}
            max={40}
            value={threshold}
            onChange={(value) => {
              startTrackingIfIdle("brokenMemoization");
              setThreshold(value);
            }}
            className="w-32 @max-[340px]:w-[calc(100cqw-164px)]"
          />
          <span className="w-8 text-right">{threshold}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 @min-[640px]:grid-cols-2 @min-[1024px]:grid-cols-4 @min-[1280px]:grid-cols-5">
        {isBrokenMemoizationOn
          ? // Case 8 bad path: `card` is spread into a brand-new object on every render of this component, MicroCardUnoptimized's React.memo can never see it as unchanged, so every slider tick still fully re-renders all 100 cards, plus 100 wasted prop comparisons.
            products.map((product) => (
              <MicroCardUnoptimized
                key={product.id}
                card={{ ...product }}
                threshold={threshold}
              />
            ))
          : products.map((product, i) => (
              <MicroCard
                key={product.id}
                id={product.id}
                title={product.meta.title}
                sku={product.meta.sku}
                marginality={product.marginality}
                value={formatCurrency(product.metrics.currentValue)}
                rating={product.metrics.rating}
                sparklineData={sparklines[i]}
                lowMargin={product.marginality < threshold}
              />
            ))}
      </div>
    </Card>
  );
}
