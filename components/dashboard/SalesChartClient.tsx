"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { SalesChartData } from "@/types/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Period = "day" | "week" | "month";

interface Props {
  data: SalesChartData;
}

// recharts measures the DOM to size itself, so it's client-only regardless; ssr:false additionally keeps it out of the very first paint entirely, the fixed h-48 wrapper below reserves its space so nothing shifts when it mounts.
const SalesChartCanvas = dynamic(() => import("./SalesChartCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-xl bg-raise" />
  ),
});

export function SalesChartClient({ data: salesChart }: Props) {
  const [period, setPeriod] = useState<Period>("week");

  const data = salesChart[period];
  const total = data.reduce((s, p) => s + p.value, 0);

  return (
    <Card variant="global" data-section="sales-chart">
      <div className="mb-heading-gap flex flex-wrap items-center gap-2">
        <div>
          <h2 className="heading-2">Revenue</h2>
          <p className="text-sm text-text-2 min-w-52">
            <span className="font-semibold text-lg text-pos">
              {formatCurrency(total)}
            </span>{" "}
            this period
          </p>
        </div>
        <div className="ml-auto flex gap-1 rounded-lg border border-border-strong p-0.5">
          {(["day", "week", "month"] as Period[]).map((p) => (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={period === p ? "default" : "ghost"}
              onClick={() => setPeriod(p)}
              className="border capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-48 w-full">
        <SalesChartCanvas data={data} />
      </div>

      <div className="mt-1 flex justify-between text-sm text-text-3">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </Card>
  );
}
