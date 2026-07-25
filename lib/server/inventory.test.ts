import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  deriveRealProductId,
  deriveLogisticStatus,
  getAmplifiedProducts,
} from "@/lib/server/inventory";

// Real network calls are mocked at the fetcher boundary; getAmplifiedProducts is the only piece under test here that touches it.
vi.mock("@/lib/server/fetcher", () => ({
  apiFetch: vi.fn(),
}));
import { apiFetch } from "@/lib/server/fetcher";

// See deriveRealProductId in inventory.ts for why this inverse mapping exists.
describe("deriveRealProductId", () => {
  it("round-trips every real id across all 20 batch offsets the app produces", () => {
    for (let baseId = 1; baseId <= 100; baseId++) {
      for (let batchOffset = 0; batchOffset <= 19; batchOffset++) {
        expect(deriveRealProductId(baseId + batchOffset * 100)).toBe(baseId);
      }
    }
  });
});

describe("deriveLogisticStatus", () => {
  it("returns Out of Stock at the critical-stock boundary (stock=3)", () => {
    expect(deriveLogisticStatus(3, "Ships overnight")).toBe("Out of Stock");
  });

  it("returns To Order just above the critical boundary (stock=4)", () => {
    expect(deriveLogisticStatus(4, "Ships overnight")).toBe("To Order");
  });

  it("returns To Order at the low-stock boundary (stock=10)", () => {
    expect(deriveLogisticStatus(10, "Ships overnight")).toBe("To Order");
  });

  it.each([
    ["Ships overnight", "In Stock"],
    ["Ships in 1-2 business days", "In Stock"],
    ["Ships in 3-5 business days", "In Stock"],
    ["Ships in 1 week", "In Transit"],
    ["Ships in 2 weeks", "Ordered"],
    ["Ships in 1 month", "To Order"],
  ] as const)(
    "maps '%s' to '%s' once stock is healthy (stock=11)",
    (shipping, expected) => {
      expect(deriveLogisticStatus(11, shipping)).toBe(expected);
    },
  );
});

// See getAmplifiedProducts in inventory.ts for the amplification rules being asserted below. Fetched once via a mocked apiFetch and reused across assertions; getAmplifiedProducts is wrapped in React's cache(), so calling it more than once per test file risks returning a stale memoized result from an earlier mock.
describe("getAmplifiedProducts", () => {
  const fixtureProducts = [
    {
      id: 1,
      title: "Wireless Mouse",
      category: "electronics",
      price: 25,
      stock: 50,
      thumbnail: "t1.jpg",
      images: ["t1.jpg"],
      discountPercentage: 5,
      rating: 4.2,
      brand: "Acme",
      sku: "SKU-001",
      shippingInformation: "Ships overnight",
    },
    {
      id: 2,
      title: "Desk Lamp",
      category: "furniture",
      price: 40,
      stock: 2,
      thumbnail: "t2.jpg",
      images: ["t2.jpg"],
      discountPercentage: 0,
      rating: 3.9,
      sku: "SKU-002",
      shippingInformation: "Ships in 2 weeks",
    },
  ];

  let result: Awaited<ReturnType<typeof getAmplifiedProducts>>;

  beforeAll(async () => {
    vi.mocked(apiFetch).mockResolvedValue({ products: fixtureProducts });
    result = await getAmplifiedProducts();
  });

  it("amplifies every base product into exactly 20 copies", () => {
    expect(result).toHaveLength(fixtureProducts.length * 20);
  });

  it("keeps the original id and title unchanged for the first (unamplified) copy", () => {
    expect(result[0].id).toBe(1);
    expect(result[0].title).toBe("Wireless Mouse");
  });

  it("shifts id by +100 and appends '(Batch 2)' for the second copy", () => {
    const secondCopy = result.find((p) => p.id === 101);
    expect(secondCopy?.title).toBe("Wireless Mouse (Batch 2)");
  });

  it("shifts id by +1900 and appends '(Batch 20)' for the last (20th) copy", () => {
    const lastCopy = result.find((p) => p.id === 1901);
    expect(lastCopy?.title).toBe("Wireless Mouse (Batch 20)");
  });

  it("keeps sku identical across all 20 copies of the same product", () => {
    const skus = result
      .filter((p) => deriveRealProductId(p.id) === 1)
      .map((p) => p.sku);
    expect(skus).toHaveLength(20);
    expect(new Set(skus).size).toBe(1);
    expect(skus[0]).toBe("SKU-001");
  });

  it("wires logisticStatus through from deriveLogisticStatus for the fixture's stock/shipping", () => {
    const deskLampCopy = result.find((p) => p.id === 2);
    expect(deskLampCopy?.logisticStatus).toBe(
      deriveLogisticStatus(2, "Ships in 2 weeks"),
    );
  });
});
