import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { SelectedProduct } from "@/store/inventory-selection";
import SelectAllCheckbox from "@/components/inventory/SelectAllCheckbox";
import { TableSelectionProvider } from "@/context/TableSelectionContext";
import { useInventorySelectionStore } from "@/store/inventory-selection";
import { useSimControlStore } from "@/store/simulator-control";

function makeSelected(id: number): SelectedProduct {
  return { id, title: `Product ${id}`, sku: `SKU-${id}`, logisticStatus: "In Stock" };
}

// Not about Case 7 (contextOverhead stays off, its default), this is the plain admin behavior of components/inventory/SelectAllCheckbox.tsx. `allVisibleSelected` must be true only when EVERY visible product is selected (not "at least one"), and toggling must only ever add/remove the *visible* products; a product selected outside of `visibleProducts` (as if filtered/scrolled out of view) must never be touched by this checkbox.
const visibleProducts = [1, 2, 3].map(makeSelected);

beforeEach(() => {
  useSimControlStore.getState().resetToggles();
  useInventorySelectionStore.setState({ selected: new Map() });
});

function renderCheckbox() {
  return render(
    <TableSelectionProvider>
      <SelectAllCheckbox visibleProducts={visibleProducts} />
    </TableSelectionProvider>,
  );
}

describe("SelectAllCheckbox", () => {
  it("is unchecked when only some of the visible products are selected", () => {
    useInventorySelectionStore.setState({
      selected: new Map([
        [1, makeSelected(1)],
        [4, makeSelected(4)], // selected, but not in visibleProducts
      ]),
    });

    renderCheckbox();

    expect(screen.getByRole("checkbox", { name: /select all visible/i })).not.toBeChecked();
  });

  it("is checked when every visible product is selected, regardless of an off-screen selection", () => {
    useInventorySelectionStore.setState({
      selected: new Map([
        [1, makeSelected(1)],
        [2, makeSelected(2)],
        [3, makeSelected(3)],
        [4, makeSelected(4)],
      ]),
    });

    renderCheckbox();

    expect(screen.getByRole("checkbox", { name: /select all visible/i })).toBeChecked();
  });

  it("checking it selects exactly the visible products, without touching an off-screen selection", async () => {
    useInventorySelectionStore.setState({
      selected: new Map([[4, makeSelected(4)]]),
    });

    renderCheckbox();
    await userEvent.click(screen.getByRole("checkbox", { name: /select all visible/i }));

    const selected = useInventorySelectionStore.getState().selected;
    expect([...selected.keys()].sort()).toEqual([1, 2, 3, 4]);
  });

  it("unchecking it (all visible selected) deselects only the visible products", async () => {
    useInventorySelectionStore.setState({
      selected: new Map([
        [1, makeSelected(1)],
        [2, makeSelected(2)],
        [3, makeSelected(3)],
        [4, makeSelected(4)],
      ]),
    });

    renderCheckbox();
    await userEvent.click(screen.getByRole("checkbox", { name: /select all visible/i }));

    const selected = useInventorySelectionStore.getState().selected;
    expect([...selected.keys()]).toEqual([4]);
  });
});
