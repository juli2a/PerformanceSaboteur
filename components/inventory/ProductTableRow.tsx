"use client";

import { memo } from "react";

import type { AmplifiedProduct } from "@/types/inventory";
import { useInventorySelectionStore } from "@/store/inventory-selection";
import { useInventoryStatusStore } from "@/store/inventory-status";
import { useRenderCounterStore } from "@/store/render-counter";
import ProductTableRowView from "@/components/inventory/ProductTableRowView";

interface ProductTableRowProps {
  product: AmplifiedProduct;
  gridTemplateColumns: string;
}

// Subscribes to its own id only, toggling one row's checkbox re-renders just this component, not the rest of the (virtualized) row list. This is the atomic-selector baseline Case 7 contrasts against Context later.
//
// Wrapped in memo() so ProductTable's own re-renders (e.g. from useVirtualizer tracking scroll position) don't cascade into every currently-mounted row re-executing; this component should only actually re-render when its own props change or one of its own subscriptions (the selector above) reports a change, not just because its parent did.
function ProductTableRow({
  product,
  gridTemplateColumns,
}: ProductTableRowProps) {
  const isSelected = useInventorySelectionStore((state) =>
    state.selected.has(product.id),
  );
  const toggleRow = useInventorySelectionStore((state) => state.toggleRow);
  const startTracking = useRenderCounterStore((state) => state.startTracking);
  const logisticStatus = useInventoryStatusStore(
    (state) => state.statuses.get(product.id) ?? product.logisticStatus,
  );

  return (
    <ProductTableRowView
      product={product}
      gridTemplateColumns={gridTemplateColumns}
      isSelected={isSelected}
      logisticStatus={logisticStatus}
      onToggleSelected={() => {
        startTracking("contextOverhead");
        toggleRow({
          id: product.id,
          title: product.title,
          sku: product.sku,
          logisticStatus: product.logisticStatus,
        });
      }}
    />
  );
}

export default memo(ProductTableRow);
