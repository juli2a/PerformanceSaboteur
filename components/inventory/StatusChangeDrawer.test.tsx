import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { server } from "@/mocks/server";
import type { AmplifiedProduct } from "@/types/inventory";
import StatusChangeDrawer from "@/components/inventory/StatusChangeDrawer";

const product: AmplifiedProduct = {
  id: 1,
  title: "Product 1",
  category: "Beauty",
  price: 10,
  stock: 5,
  thumbnail: "/thumb-1.jpg",
  images: ["/img-1.jpg"],
  discountPercentage: 0,
  rating: 4,
  sku: "SKU-1",
  logisticStatus: "In Stock",
};

async function openDrawer(onChangeStatus = vi.fn()) {
  render(
    <StatusChangeDrawer
      product={product}
      currentStatus="In Stock"
      onChangeStatus={onChangeStatus}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Change status" }));
  return onChangeStatus;
}

// Own correctness of components/inventory/StatusChangeDrawer.tsx, not Case 7 (that's the mobile ProductCard test, which reuses this real drawer as UI). `onChangeStatus` is passed as a plain vi.fn() here since which store/Context it writes to isn't this component's concern.
describe("StatusChangeDrawer", () => {
  it("disables the option matching the product's current status", async () => {
    await openDrawer();

    expect(screen.getByRole("button", { name: /In Stock/ })).toBeDisabled();
  });

  it("disables the Change confirm button until a different status is picked", async () => {
    await openDrawer();

    expect(screen.getByRole("button", { name: "Change" })).toBeDisabled();
  });

  it("picking a status and confirming PATCHes the product and calls onChangeStatus with the new status", async () => {
    let patchedId: string | undefined;
    let patchedBody: unknown;
    server.use(
      http.patch("https://dummyjson.com/products/:id", async ({ params, request }) => {
        patchedId = params.id as string;
        patchedBody = await request.json();
        return HttpResponse.json({ id: Number(patchedId) });
      }),
    );

    const onChangeStatus = await openDrawer();
    await userEvent.click(screen.getByRole("button", { name: /To Order/ }));
    await userEvent.click(screen.getByRole("button", { name: "Change" }));

    await waitFor(() => {
      expect(onChangeStatus).toHaveBeenCalledWith([1], "To Order");
    });
    expect(patchedId).toBe("1");
    expect(patchedBody).toEqual({ logisticStatus: "To Order" });
  });
});
