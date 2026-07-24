import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";

import type { AmplifiedProduct } from "@/types/inventory";
import ProductTable, {
  FLAT_ROW_LIMIT,
} from "@/components/inventory/ProductTable";
import { MediaContext } from "@/context/MediaContext";
import { TableSelectionProvider } from "@/context/TableSelectionContext";
import { useSimControlStore } from "@/store/simulator-control";
import { useInventoryFiltersStore } from "@/store/inventory-filters";
import { useInventorySearchStore } from "@/store/inventory-search";
import { useInventorySelectionStore } from "@/store/inventory-selection";

function makeProduct(id: number): AmplifiedProduct {
  return {
    id,
    title: `Product ${id}`,
    category: "Beauty",
    price: 10,
    stock: 5,
    thumbnail: `/thumb-${id}.jpg`,
    images: [`/img-${id}.jpg`],
    discountPercentage: 0,
    rating: 4,
    sku: `SKU-${id}`,
    logisticStatus: "In Stock",
  };
}

const products = Array.from({ length: 250 }, (_, i) => makeProduct(i + 1));

beforeEach(() => {
  useSimControlStore.getState().resetToggles();
  useInventoryFiltersStore.setState({ categories: new Set() });
  useInventorySearchStore.setState({ matchedIds: null });
  useInventorySelectionStore.setState({ selected: new Map() });
});

function renderTable() {
  return render(
    <MediaContext.Provider value={false}>
      <TableSelectionProvider>
        <ProductTable products={products} />
      </TableSelectionProvider>
    </MediaContext.Provider>,
  );
}

// role="row" also appears on the sticky header (outside role="rowgroup"), so counting has to scope to the rowgroup to get just the data rows.
function countMountedRows(container: HTMLElement): number {
  const rowgroup = container.querySelector('[role="rowgroup"]');
  return rowgroup ? rowgroup.querySelectorAll('[role="row"]').length : 0;
}

// Case 3 (heavyMounting): components/inventory/ProductTable.tsx. `flatRowLimit` is the whole row list's length when heavyMounting is on (no cap at all) vs the fixed FLAT_ROW_LIMIT otherwise. Both branches tested here render the flat (non-virtualized) path, deliberately avoiding the default all-toggles-off virtualized branch: @tanstack/react-virtual decides visible-row count from real container layout, which jsdom always reports as zero-sized, so that branch isn't tested here.
describe("ProductTable row mounting (Case 3 vs Case 7)", () => {
  it("Case 7 alone: flat list caps at FLAT_ROW_LIMIT (200) regardless of dataset size", () => {
    useSimControlStore.getState().setToggle("contextOverhead", true);

    const { container } = renderTable();

    expect(countMountedRows(container)).toBe(FLAT_ROW_LIMIT);
  });

  it("Case 3 alone: removes the cap, mounts every one of the 250 rows", () => {
    useSimControlStore.getState().setToggle("heavyMounting", true);

    const { container } = renderTable();

    expect(countMountedRows(container)).toBe(250);
  });

  it("Case 3 + Case 7 together: Case 3's uncapped behavior wins over Case 7's 200-row cap", () => {
    useSimControlStore.getState().setToggle("heavyMounting", true);
    useSimControlStore.getState().setToggle("contextOverhead", true);

    const { container } = renderTable();

    expect(countMountedRows(container)).toBe(250);
  });
});

// Category filter effect (5.2, not tied to a simulator case), components/inventory/ProductTable.tsx: selecting a category in useInventoryFiltersStore feeds react-table's controlled `columnFilters`, which should narrow the mounted rows down to just that category. The filter checkbox UI itself (CategoryFilterList) is a thin Set.add/delete wrapper with no branching logic and isn't tested, this is the actual integration point: does the store value really narrow what's rendered.
describe("ProductTable category filter effect", () => {
  const mixedCategoryProducts: AmplifiedProduct[] = [
    { ...makeProduct(1), category: "Beauty" },
    { ...makeProduct(2), category: "Beauty" },
    { ...makeProduct(3), category: "Electronics" },
  ];

  function renderMixedTable() {
    // heavyMounting forces the flat, unwindowed render path so the row count reflects the filter alone, not @tanstack/react-virtual's unpredictable-in-jsdom viewport-based windowing (same reasoning as the Case 3/7 tests above).
    useSimControlStore.getState().setToggle("heavyMounting", true);
    return render(
      <MediaContext.Provider value={false}>
        <TableSelectionProvider>
          <ProductTable products={mixedCategoryProducts} />
        </TableSelectionProvider>
      </MediaContext.Provider>,
    );
  }

  it("selecting a category narrows the mounted rows to just that category", () => {
    useInventoryFiltersStore.setState({ categories: new Set(["Beauty"]) });

    const { container } = renderMixedTable();

    expect(countMountedRows(container)).toBe(2);
  });

  it("control case: with no category selected, every row mounts", () => {
    const { container } = renderMixedTable();

    expect(countMountedRows(container)).toBe(3);
  });
});
