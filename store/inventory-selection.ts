import { create } from "zustand";

import type { LogisticStatus } from "@/types/inventory";

// Row-selection state for the Inventory table, kept deliberately separate from @tanstack/react-table's built-in rowSelection model: rows subscribe to their own id atomically (`state => state.selected.has(id)`), so toggling one checkbox only re-renders that row; the baseline Case 7 (Context vs Zustand selector) needs this to demonstrate a real contrast.
//
// Stores title/sku/logisticStatus alongside the id (not just the id) so Bulk Actions can list the selected products without holding the full row dataset on the client just to look up a handful of entries.
export interface SelectedProduct {
  id: number;
  title: string;
  sku: string;
  logisticStatus: LogisticStatus;
}

interface InventorySelectionState {
  selected: Map<number, SelectedProduct>;
  toggleRow: (product: SelectedProduct) => void;
  setSelection: (products: SelectedProduct[], selected: boolean) => void;
  clear: () => void;
}

export const useInventorySelectionStore = create<InventorySelectionState>(
  (set) => ({
    selected: new Map(),
    toggleRow: (product) =>
      set((state) => {
        const next = new Map(state.selected);
        if (next.has(product.id)) next.delete(product.id);
        else next.set(product.id, product);
        return { selected: next };
      }),
    setSelection: (products, selected) =>
      set((state) => {
        const next = new Map(state.selected);
        for (const product of products) {
          if (selected) next.set(product.id, product);
          else next.delete(product.id);
        }
        return { selected: next };
      }),
    clear: () => set({ selected: new Map() }),
  }),
);
