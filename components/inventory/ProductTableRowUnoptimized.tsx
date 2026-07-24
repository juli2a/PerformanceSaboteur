"use client";

import { memo, useContext } from "react";

import type { AmplifiedProduct } from "@/types/inventory";
import { TableSelectionContext } from "@/context/TableSelectionContext";
import { useInventoryStatusStore } from "@/store/inventory-status";
import { useRenderCounterStore } from "@/store/render-counter";
import ProductTableRowView from "@/components/inventory/ProductTableRowView";

interface ProductTableRowUnoptimizedProps {
  product: AmplifiedProduct;
  gridTemplateColumns: string;
}

// Case 7 (Context Overhead) bad path: the only difference from ProductTableRow is *how* it reads/writes selection, a monolithic Context instead of an atomic Zustand selector. Every row consuming TableSelectionContext re-renders on any row's toggle, since the Provider hands out a brand-new object every time (see context/TableSelectionContext.tsx). Everything else, markup, status subscription, is shared with ProductTableRow via ProductTableRowView on purpose, so the contrast is isolated to the one thing this case demonstrates.
//
// Also wrapped in memo() like ProductTableRow, for the same reason (so ProductTable's own re-renders don't add unrelated noise): memo doesn't block the re-render this case actually demonstrates, since that comes from useContext detecting a changed Provider value, not from a parent re-render with unchanged props.
function ProductTableRowUnoptimized({
  product,
  gridTemplateColumns,
}: ProductTableRowUnoptimizedProps) {
  const { selected, toggleRow } = useContext(TableSelectionContext)!;
  const isSelected = selected.has(product.id);
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

export default memo(ProductTableRowUnoptimized);
