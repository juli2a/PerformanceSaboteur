"use client";

import { useContext } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  useInventorySelectionStore,
  type SelectedProduct,
} from "@/store/inventory-selection";
import { TableSelectionContext } from "@/context/TableSelectionContext";
import { useSimulatorCase } from "@/hooks/useSimulatorCase";

interface SelectAllCheckboxProps {
  visibleProducts: SelectedProduct[];
}

// Reads the full selection set, kept out of the row list so its re-render never cascades into ProductTableRow's atomic per-row subscriptions.
//
// Case 7 (Context Overhead): reads/writes whichever selection source is currently active (Zustand or the isolated Context, see context/TableSelectionContext.tsx) so Select All stays functionally correct regardless of the demo toggle. This component isn't part of what the case demonstrates, only the row re-render count is, so both sources are read unconditionally here rather than only mounting one.
export default function SelectAllCheckbox({
  visibleProducts,
}: SelectAllCheckboxProps) {
  const isContextOverheadOn = useSimulatorCase("contextOverhead");
  const zustandSelected = useInventorySelectionStore((state) => state.selected);
  const zustandSetSelection = useInventorySelectionStore(
    (state) => state.setSelection,
  );
  const context = useContext(TableSelectionContext)!;

  const selected = isContextOverheadOn ? context.selected : zustandSelected;
  const setSelection = isContextOverheadOn
    ? context.setSelection
    : zustandSetSelection;

  const allVisibleSelected =
    visibleProducts.length > 0 &&
    visibleProducts.every((product) => selected.has(product.id));

  return (
    <Checkbox
      checked={allVisibleSelected}
      onCheckedChange={(checked) => setSelection(visibleProducts, checked)}
      aria-label="Select all visible products"
    />
  );
}
