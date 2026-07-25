"use client";

import { memo, useContext } from "react";

import type { AmplifiedProduct } from "@/types/inventory";
import { RowStatusContext } from "@/context/RowStatusContext";
import { useRenderCounterStore } from "@/store/render-counter";
import ProductCardView from "@/components/inventory/ProductCardView";

interface ProductCardUnoptimizedProps {
  product: AmplifiedProduct;
}

// Case 7 (Context Overhead) mobile bad path: the only difference from ProductCard is *how* it reads/writes status, a monolithic Context instead of an atomic Zustand selector. Every card consuming RowStatusContext re-renders on any card's status change, since the Provider hands out a brand-new Map every time (see context/RowStatusContext.tsx). Everything else, markup, the status-change trigger, is shared with ProductCard via ProductCardView on purpose, so the contrast is isolated to the one thing this case demonstrates.
//
// Also wrapped in memo() like ProductCard, for the same reason: memo doesn't block the re-render this case actually demonstrates, since that comes from useContext detecting a changed Provider value, not from a parent re-render with unchanged props.
function ProductCardUnoptimized({ product }: ProductCardUnoptimizedProps) {
  const { statuses, setStatuses } = useContext(RowStatusContext)!;
  const logisticStatus = statuses.get(product.id) ?? product.logisticStatus;
  const startTracking = useRenderCounterStore((state) => state.startTracking);

  return (
    <ProductCardView
      product={product}
      logisticStatus={logisticStatus}
      onChangeStatus={(ids, status) => {
        startTracking("contextOverhead");
        setStatuses(ids, status);
      }}
    />
  );
}

export default memo(ProductCardUnoptimized);
