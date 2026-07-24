"use client";

import { createContext, useState } from "react";

import type { SelectedProduct } from "@/store/inventory-selection";
import { useSimulatorCase } from "@/hooks/useSimulatorCase";

export interface TableSelectionContextValue {
  selected: Map<number, SelectedProduct>;
  toggleRow: (product: SelectedProduct) => void;
  setSelection: (products: SelectedProduct[], selected: boolean) => void;
  clear: () => void;
}

export const TableSelectionContext =
  createContext<TableSelectionContextValue | null>(null);

// Case 7 (Context Overhead) bad-path state, deliberately isolated from useInventorySelectionStore (the good-path store), not a mirror of it, so the two demo modes never carry a stale selection into one another. Mirrors that store's own API 1:1 (same shape: selected/toggleRow/setSelection/clear) so SelectAllCheckbox and BulkActions can read whichever source is currently active without behaving differently. Mounted once at the page root (wrapping both Toolbar and ProductTable) so those two toolbar components can reach it too; always present, but only ProductTableRowUnoptimized (and the toolbar's dual-source reads) actually consume it.
export function TableSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<Map<number, SelectedProduct>>(
    new Map(),
  );
  const isContextOverheadOn = useSimulatorCase("contextOverhead");

  // Clears on every toggle flip, in either direction, so this isolated selection never carries over from or into the Zustand-backed one. React's own documented "adjusting state when a prop changes" pattern (setting state directly during render, guarded by a comparison against the previous value) rather than a useEffect, which would cause an extra cascading render for the same update.
  const [prevToggle, setPrevToggle] = useState(isContextOverheadOn);
  if (isContextOverheadOn !== prevToggle) {
    setPrevToggle(isContextOverheadOn);
    setSelected(new Map());
  }

  // Anti-pattern (see docs/case7.md): every mutation replaces the whole Map with a new instance, with no memoization; every consumer of this Provider's value re-renders on every toggle, not just the row whose checkbox changed.
  const toggleRow = (product: SelectedProduct) => {
    setSelected((selected) => {
      const next = new Map(selected);
      if (next.has(product.id)) next.delete(product.id);
      else next.set(product.id, product);
      return next;
    });
  };

  const setSelection = (products: SelectedProduct[], selected: boolean) => {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const product of products) {
        if (selected) next.set(product.id, product);
        else next.delete(product.id);
      }
      return next;
    });
  };

  const clear = () => setSelected(new Map());

  return (
    <TableSelectionContext.Provider
      value={{ selected, toggleRow, setSelection, clear }}
    >
      {children}
    </TableSelectionContext.Provider>
  );
}
