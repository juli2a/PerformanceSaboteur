"use client";

import { memo, useMemo } from "react";

import type { AnalyticCardData } from "@/types/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { processSparklineHistory } from "@/lib/utils/sparkline-processing";
import MicroCardView from "@/components/dashboard/MicroCardView";

interface Props {
  card: AnalyticCardData;
  threshold: number;
}

// Case 8 (Broken Memoization) bad path, wrapped in React.memo, but its parent (MicroCardsGridClient) hands it a freshly-spread `card` object on every one of its own renders. memo's prevProps !== nextProps check sees a changed reference on every slider tick, so it never actually skips a re-render, it only adds a prop-comparison pass on top of the re-render that would have happened anyway, ×100 cards.
function MicroCardUnoptimized({ card, threshold }: Props) {
  // The bad path pushes the sparkline pipeline's memoization down to each card individually, assuming per-card caching would be even more targeted than doing it once for the whole grid (see MicroCardsGridClient's own `sparklines` useMemo, the good path). But `card` is a new object on every render (see above), so this cache never hits either: the full clean → smooth → downsample pass over 365 raw daily readings reruns for all 100 cards on every slider tick, instead of the one time the good path spends on it.

  const sparklineData = useMemo(
    () => processSparklineHistory(card.rawHistory),
    [card],
  );

  return (
    <MicroCardView
      id={card.id}
      title={card.meta.title}
      sku={card.meta.sku}
      marginality={card.marginality}
      value={formatCurrency(card.metrics.currentValue)}
      rating={card.metrics.rating}
      sparklineData={sparklineData}
      lowMargin={card.marginality < threshold}
    />
  );
}

export default memo(MicroCardUnoptimized);
