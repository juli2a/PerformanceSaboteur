import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { server } from "@/mocks/server";
import type { AmplifiedProduct } from "@/types/inventory";
import ProductCard from "@/components/inventory/ProductCard";
import ProductCardUnoptimized from "@/components/inventory/ProductCardUnoptimized";
import { RowStatusProvider } from "@/context/RowStatusContext";
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
  useInventoryStatusStore.setState({ statuses: new Map() });
  useRenderCounterStore.setState({ counters: {} });
  server.use(
    http.patch("https://dummyjson.com/products/:id", ({ params }) =>
      HttpResponse.json({ id: Number(params.id) }),
    ),
  );
});

// Changes the middle card's (index 1, product id=2) status via the real StatusChangeDrawer UI: open -> pick a different status -> confirm.
async function changeMiddleCardStatus() {
  const triggers = screen.getAllByRole("button", { name: "Change status" });
  await userEvent.click(triggers[1]);
  await userEvent.click(screen.getByRole("button", { name: /To Order/ }));
  await userEvent.click(screen.getByRole("button", { name: "Change" }));
}

// Case 7 (contextOverhead) mobile branch, per lib/simulator-cases.ts mobileTip: unlike the desktop story (row selection via checkbox), the mobile trigger is changing a product's status. ProductCard (good path) reads/writes useInventoryStatusStore via a per-id selector; ProductCardUnoptimized (bad path) reads/writes context/RowStatusContext.tsx, whose Provider hands out a brand-new Map to every consumer on each change. Both wrap ProductCardView in FlashOnUpdate caseKey="contextOverhead" (components/inventory/ProductCardView.tsx), the same ready-made counter already used for the desktop story in components/inventory/ProductTableRow.test.tsx. Interacts through the real StatusChangeDrawer (not a direct onChangeStatus call) so the actual Card->View->Drawer chain this case demonstrates is what's exercised.
describe("ProductCard vs ProductCardUnoptimized (Case 7, mobile)", () => {
  it("good path (Zustand selector): changing one card's status re-renders only that card", async () => {
    render(
      <>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </>,
    );

    await changeMiddleCardStatus();

    await waitFor(() => {
      expect(useRenderCounterStore.getState().counters.contextOverhead?.count).toBe(
        1,
      );
    });
  });

  it("bad path (Context): changing one card's status re-renders every card", async () => {
    render(
      <RowStatusProvider>
        {products.map((product) => (
          <ProductCardUnoptimized key={product.id} product={product} />
        ))}
      </RowStatusProvider>,
    );

    await changeMiddleCardStatus();

    await waitFor(() => {
      expect(useRenderCounterStore.getState().counters.contextOverhead?.count).toBe(
        3,
      );
    });
  });
});
