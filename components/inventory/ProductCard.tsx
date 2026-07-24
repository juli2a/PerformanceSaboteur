"use client";

import { memo } from "react";

import type { AmplifiedProduct } from "@/types/inventory";
import { useInventoryStatusStore } from "@/store/inventory-status";
import { useRenderCounterStore } from "@/store/render-counter";
import ProductCardView from "@/components/inventory/ProductCardView";

interface ProductCardProps {
  product: AmplifiedProduct;
}

// Mobile card variant of a product row, the good path (Case 7's contrast to ProductCardUnoptimized). Subscribes to its own id only via useInventoryStatusStore, so changing one card's status re-renders just this component.
//
// Wrapped in memo() so ProductTable's own re-renders (filters, search, isMobile/isContextOverheadOn flips) don't cascade into every currently-mounted card re-executing; mirrors ProductTableRow's reasoning.
function ProductCard({ product }: ProductCardProps) {
  const logisticStatus = useInventoryStatusStore(
    (state) => state.statuses.get(product.id) ?? product.logisticStatus,
  );
  const setStatuses = useInventoryStatusStore((state) => state.setStatuses);
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

export default memo(ProductCard);
