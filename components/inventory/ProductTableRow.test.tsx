import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AmplifiedProduct } from "@/types/inventory";
import ProductTableRow from "@/components/inventory/ProductTableRow";
import ProductTableRowUnoptimized from "@/components/inventory/ProductTableRowUnoptimized";
import { TableSelectionProvider } from "@/context/TableSelectionContext";
import { useInventorySelectionStore } from "@/store/inventory-selection";
import { useInventoryStatusStore } from "@/store/inventory-status";
import { useRenderCounterStore } from "@/store/render-counter";

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

const products = [1, 2, 3].map(makeProduct);

beforeEach(() => {
  useInventorySelectionStore.setState({ selected: new Map() });
  useInventoryStatusStore.setState({ statuses: new Map() });
  useRenderCounterStore.setState({ counters: {} });
});

// Case 7 (contextOverhead): ProductTableRow (Zustand selector, good path) vs ProductTableRowUnoptimized (Context, bad path). Both paths share ProductTableRowView, wrapped in FlashOnUpdate caseKey="contextOverhead" (components/simulator/FlashOnUpdate.tsx), which already increments useRenderCounterStore on every real re-render after mount, this test counts that existing counter rather than inventing a new way to detect re-renders. Rendered directly (not through ProductTable) to sidestep @tanstack/react-virtual, whose visible-row count is not honestly determinable in jsdom.
describe("ProductTableRow vs ProductTableRowUnoptimized (Case 7)", () => {
  it("good path (Zustand selector): clicking one row's checkbox re-renders only that row", async () => {
    render(
      <>
        {products.map((product) => (
          <ProductTableRow
            key={product.id}
            product={product}
            gridTemplateColumns="1fr"
          />
        ))}
      </>,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: `Select ${products[1].title}`,
    });
    await userEvent.click(checkbox);

    expect(useRenderCounterStore.getState().counters.contextOverhead?.count).toBe(
      1,
    );
  });

  it("bad path (Context): clicking one row's checkbox re-renders every row", async () => {
    render(
      <TableSelectionProvider>
        {products.map((product) => (
          <ProductTableRowUnoptimized
            key={product.id}
            product={product}
            gridTemplateColumns="1fr"
          />
        ))}
      </TableSelectionProvider>,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: `Select ${products[1].title}`,
    });
    await userEvent.click(checkbox);

    expect(useRenderCounterStore.getState().counters.contextOverhead?.count).toBe(
      3,
    );
  });
});
