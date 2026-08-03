import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { server } from "@/mocks/server";
import type { LogisticStatus } from "@/types/inventory";
import type { SelectedProduct } from "@/store/inventory-selection";
import BulkActions from "@/components/inventory/BulkActions";
import { TableSelectionProvider } from "@/context/TableSelectionContext";
import { useInventorySelectionStore } from "@/store/inventory-selection";
import { useInventoryStatusStore } from "@/store/inventory-status";
import { useSimControlStore } from "@/store/simulator-control";

function makeSelected(
  id: number,
  logisticStatus: SelectedProduct["logisticStatus"],
): SelectedProduct {
  return { id, title: `Product ${id}`, sku: `SKU-${id}`, logisticStatus };
}

beforeEach(() => {
  useSimControlStore.getState().resetToggles();
  useInventorySelectionStore.setState({ selected: new Map() });
  useInventoryStatusStore.setState({ statuses: new Map() });
});

function renderBulkActions() {
  return render(
    <TableSelectionProvider>
      <BulkActions />
    </TableSelectionProvider>,
  );
}

// Opens the Bulk Actions popover, picks the given status in the Select (which lives inside this popover, not the confirm dialog, see components/inventory/BulkActions.tsx), then clicks through to the confirm dialog.
async function openConfirmDialog(status: LogisticStatus) {
  await userEvent.click(screen.getByRole("button", { name: "Bulk Actions" }));
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.click(await screen.findByRole("option", { name: status }));
  await userEvent.click(screen.getByRole("button", { name: "Ok" }));
}

describe("BulkActions", () => {
  it("noopChange: disables the confirm button when every selected product already has the target status", async () => {
    useInventorySelectionStore.setState({
      selected: new Map([
        [1, makeSelected(1, "In Stock")],
        [2, makeSelected(2, "In Stock")],
      ]),
    });

    renderBulkActions();
    await openConfirmDialog("In Stock");

    expect(screen.getByRole("button", { name: "Ok" })).toBeDisabled();
  });

  it("noopChange: enables the confirm button when selected products have mixed statuses", async () => {
    useInventorySelectionStore.setState({
      selected: new Map([
        [1, makeSelected(1, "In Stock")],
        [2, makeSelected(2, "To Order")],
      ]),
    });

    renderBulkActions();
    await openConfirmDialog("In Stock");

    expect(screen.getByRole("button", { name: "Ok" })).toBeEnabled();
  });

  it("full flow: confirming PATCHes every selected product, applies the optimistic overlay, and clears the selection", async () => {
    const patched: { id: string; body: unknown }[] = [];
    server.use(
      http.patch(
        "https://dummyjson.com/products/:id",
        async ({ params, request }) => {
          patched.push({ id: params.id as string, body: await request.json() });
          return HttpResponse.json({ id: Number(params.id) });
        },
      ),
    );
    useInventorySelectionStore.setState({
      selected: new Map([
        [1, makeSelected(1, "To Order")],
        [2, makeSelected(2, "To Order")],
      ]),
    });

    renderBulkActions();
    await openConfirmDialog("In Transit");
    await userEvent.click(screen.getByRole("button", { name: "Ok" }));

    await waitFor(() => {
      expect(useInventorySelectionStore.getState().selected.size).toBe(0);
    });
    expect(
      [...useInventoryStatusStore.getState().statuses.entries()].sort(),
    ).toEqual([
      [1, "In Transit"],
      [2, "In Transit"],
    ]);
    expect(patched.map((p) => p.id).sort()).toEqual(["1", "2"]);
    patched.forEach((p) =>
      expect(p.body).toEqual({ logisticStatus: "In Transit" }),
    );
  });

  it("optimistic write: applies the new status, clears the selection, and closes the dialog before the PATCH resolves", async () => {
    let resolvePatch!: () => void;
    const patchGate = new Promise<void>((resolve) => {
      resolvePatch = resolve;
    });
    const patchedIds: string[] = [];
    server.use(
      http.patch("https://dummyjson.com/products/:id", async ({ params }) => {
        patchedIds.push(params.id as string);
        await patchGate;
        return HttpResponse.json({ id: Number(params.id) });
      }),
    );
    useInventorySelectionStore.setState({
      selected: new Map([[1, makeSelected(1, "To Order")]]),
    });

    renderBulkActions();
    await openConfirmDialog("In Transit");
    await userEvent.click(screen.getByRole("button", { name: "Ok" }));

    // The PATCH is still gated open here (patchGate unresolved), yet the store, the selection, and the dialog have already settled — proving none of them waited on the request.
    expect(useInventoryStatusStore.getState().statuses.get(1)).toBe(
      "In Transit",
    );
    expect(useInventorySelectionStore.getState().selected.size).toBe(0);
    expect(screen.queryByText("Confirm status change")).not.toBeInTheDocument();

    resolvePatch();
    await waitFor(() => {
      expect(patchedIds).toEqual(["1"]);
    });
  });

  it("rollback on failure: restores each product's own original status, grouped by what it was before the change", async () => {
    server.use(
      http.patch("https://dummyjson.com/products/:id", () =>
        HttpResponse.error(),
      ),
    );
    useInventorySelectionStore.setState({
      selected: new Map([
        [1, makeSelected(1, "To Order")],
        [2, makeSelected(2, "In Stock")],
      ]),
    });

    renderBulkActions();
    await openConfirmDialog("In Transit");
    await userEvent.click(screen.getByRole("button", { name: "Ok" }));

    expect(useInventoryStatusStore.getState().statuses.get(1)).toBe(
      "In Transit",
    );
    expect(useInventoryStatusStore.getState().statuses.get(2)).toBe(
      "In Transit",
    );

    await waitFor(() => {
      expect(useInventoryStatusStore.getState().statuses.get(1)).toBe(
        "To Order",
      );
    });
    expect(useInventoryStatusStore.getState().statuses.get(2)).toBe("In Stock");
    expect(useInventorySelectionStore.getState().selected.size).toBe(0);
  });
});
