import { memo } from "react";
import MicroCardView from "@/components/dashboard/MicroCardView";

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

// Case 8 (Broken Memoization) good path, memo done right. Every prop MicroCardsGridClient hands this component is reference-stable: `title`, `sku`, `marginality`, `rating` come off an unchanging product record; `value` is a freshly-formatted string but with identical content each render, so `Object.is` still calls it unchanged; `sparklineData` is the same array reference every time (computed once in the grid's own `useMemo`, not per card); and `lowMargin` only flips for the handful of cards whose `marginality` sits right at the current slider threshold. So on a given tick, memo's prop comparison actually pays off: it skips re-rendering every card whose visual state hasn't changed, instead of the "compare anyway, re-render anyway" waste in MicroCardUnoptimized, which gets a freshly-spread object and a brand new callback every render.
export default memo(function MicroCard(props: Props) {
  return <MicroCardView {...props} />;
});
