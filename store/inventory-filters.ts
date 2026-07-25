import { create } from "zustand";

// Multi-select category filter, shared between Toolbar (controls) and ProductTable (consumes it as react-table's controlled columnFilters).
interface InventoryFiltersState {
  categories: Set<string>;
  toggleCategory: (category: string) => void;
  clearCategories: () => void;
}

export const useInventoryFiltersStore = create<InventoryFiltersState>(
  (set) => ({
    categories: new Set(),
    toggleCategory: (category) =>
      set((state) => {
        const nextCategories = new Set(state.categories);
        if (nextCategories.has(category)) nextCategories.delete(category);
        else nextCategories.add(category);
        return { categories: nextCategories };
      }),
    clearCategories: () => set({ categories: new Set() }),
  }),
);
