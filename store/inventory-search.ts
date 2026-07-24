import { create } from "zustand";

// Search state for the Inventory Toolbar, separate from inventory-filters (pure client state) because this slice is driven by an async/network round-trip to /api/inventory-search and needs to track in-flight and staleness state alongside the result itself.
interface InventorySearchState {
  query: string;
  setQuery: (query: string) => void;
  // null = no active search filter (show everything); otherwise the set of base DummyJSON ids the last applied response matched.
  matchedIds: Set<number> | null;
  setMatchedIds: (ids: Set<number> | null) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  // True once a stale (out-of-order) response has overwritten a newer one; the visible symptom Case 4's bad path demonstrates.
  isStale: boolean;
  setIsStale: (isStale: boolean) => void;
}

export const useInventorySearchStore = create<InventorySearchState>((set) => ({
  query: "",
  setQuery: (query) => set({ query }),
  matchedIds: null,
  setMatchedIds: (matchedIds) => set({ matchedIds }),
  isSearching: false,
  setIsSearching: (isSearching) => set({ isSearching }),
  isStale: false,
  setIsStale: (isStale) => set({ isStale }),
}));
