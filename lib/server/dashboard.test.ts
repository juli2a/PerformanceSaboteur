import { describe, it, expect, vi, beforeAll } from "vitest";
import { getCarts, getUsers, getCategories } from "@/lib/server/dashboard";

// Real network calls are mocked at the fetcher boundary, same approach as lib/server/inventory.test.ts.
vi.mock("@/lib/server/fetcher", () => ({
  apiFetch: vi.fn(),
}));
import { apiFetch } from "@/lib/server/fetcher";

// getCarts/getUsers/getCategories are each wrapped in React's cache(), so each is fetched exactly once (via beforeAll) and reused across that describe block's assertions; calling the same cached function twice with different mocks in one test file would return the first call's stale result.

// totalRevenue = round(sum of discountedTotal); avgCheck = round(totalRevenue / actual cart count); totalOrders.value is the actual count returned, not the requested limit (see dashboard.ts).
describe("getCarts", () => {
  let kpi: Awaited<ReturnType<typeof getCarts>>["kpi"];

  beforeAll(async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      carts: [
        { id: 1, discountedTotal: 100, userId: 1 },
        { id: 2, discountedTotal: 250, userId: 2 },
        { id: 3, discountedTotal: 175, userId: 3 },
        { id: 4, discountedTotal: 75, userId: 4 },
      ],
    });
    ({ kpi } = await getCarts());
  });

  it("sums discountedTotal into totalRevenue", () => {
    expect(kpi.totalRevenue.value).toBe(600);
  });

  it("divides totalRevenue by the actual cart count for avgCheck", () => {
    expect(kpi.avgCheck.value).toBe(150);
  });

  it("uses the actual returned cart count for totalOrders, not the requested limit", () => {
    expect(kpi.totalOrders.value).toBe(4);
  });
});

// docs/data.md: "Returns the top 5 by LTV, not the first 5 in API order."
describe("getUsers", () => {
  let result: Awaited<ReturnType<typeof getUsers>>;

  beforeAll(async () => {
    // API order deliberately does not match LTV order: id=10 (lowest LTV) is first in the API response but must be dropped from the top 5.
    vi.mocked(apiFetch).mockResolvedValue({
      users: [
        { id: 10, firstName: "A", lastName: "A", age: 20, company: { name: "Co" } }, // ltv 18500
        { id: 20, firstName: "B", lastName: "B", age: 25, company: { name: "Co" } }, // ltv 32500
        { id: 5, firstName: "C", lastName: "C", age: 70, company: { name: "Co" } }, // ltv 27250
        { id: 50, firstName: "D", lastName: "D", age: 18, company: { name: "Co" } }, // ltv 67900
        { id: 1, firstName: "E", lastName: "E", age: 80, company: { name: "Co" } }, // ltv 25250
        { id: 99, firstName: "F", lastName: "F", age: 19, company: { name: "Co" } }, // ltv 129450
      ],
    });
    result = await getUsers();
  });

  it("returns exactly 5 customers", () => {
    expect(result).toHaveLength(5);
  });

  it("leads with the highest-LTV customer", () => {
    expect(result[0].id).toBe(99);
  });

  it("drops the lowest-LTV customer even though it was first in API order", () => {
    expect(result.find((u) => u.id === 10)).toBeUndefined();
  });

  it("is sorted by LTV descending", () => {
    for (let i = 1; i < result.length; i++) {
      expect(result[i].ltv).toBeLessThanOrEqual(result[i - 1].ltv);
    }
  });
});

// stockValue = price*stock summed per category; share = round(stockValue / grandTotal * 100); only the top 8 categories by stockValue are kept (see dashboard.ts).
describe("getCategories", () => {
  let result: Awaited<ReturnType<typeof getCategories>>;

  beforeAll(async () => {
    // 9 categories, one product each with stock=1 so stockValue === price.
    // Values sum to a round 1000 for easy hand-verified percentages.
    vi.mocked(apiFetch).mockResolvedValue({
      products: [
        { id: 1, category: "office-electronics", price: 300, stock: 1 },
        { id: 2, category: "kitchen-appliances", price: 200, stock: 1 },
        { id: 3, category: "home-decor", price: 150, stock: 1 },
        { id: 4, category: "sporting-goods", price: 100, stock: 1 },
        { id: 5, category: "beauty-products", price: 80, stock: 1 },
        { id: 6, category: "garden-tools", price: 70, stock: 1 },
        { id: 7, category: "pet-supplies", price: 50, stock: 1 },
        { id: 8, category: "office-supplies", price: 30, stock: 1 },
        { id: 9, category: "misc-items", price: 20, stock: 1 },
      ],
    });
    result = await getCategories();
  });

  it("keeps only the top 8 categories by stockValue", () => {
    expect(result).toHaveLength(8);
  });

  it("drops the smallest category (misc-items)", () => {
    expect(result.find((c) => c.slug === "misc-items")).toBeUndefined();
  });

  it("computes name, stockValue and share% for the top category", () => {
    expect(result[0]).toMatchObject({
      slug: "office-electronics",
      name: "office electronics",
      stockValue: 300,
      share: 30, // round(300/1000*100)
    });
  });

  it("is sorted by stockValue descending", () => {
    for (let i = 1; i < result.length; i++) {
      expect(result[i].stockValue).toBeLessThanOrEqual(result[i - 1].stockValue);
    }
  });
});
