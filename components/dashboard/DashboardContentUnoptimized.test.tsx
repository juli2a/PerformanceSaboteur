import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/server/dal/dashboard", () => ({
  getCarts: vi.fn(),
  getProducts: vi.fn(),
  getUsers: vi.fn(),
  getCategories: vi.fn(),
}));

import {
  getCarts,
  getProducts,
  getUsers,
  getCategories,
} from "@/lib/server/dal/dashboard";
import { DashboardContentUnoptimized } from "@/components/dashboard/DashboardContentUnoptimized";

// e2e/case5-waterfall.spec.ts (the "on" test) can only observe the DOM: no Suspense boundary anywhere means the whole component returns its JSX as one atomic unit regardless of whether the awaits inside it are sequential or concurrent (confirmed empirically: swapping the awaits below for a Promise.all still produced a single flush with no fallback, identical from the browser's point of view). So the actual claim Case 5's bad path makes (every request awaited one after another, not fired concurrently) can only be pinned down at the call-order level, deterministically, with no real timers or network involved.
//
// Each mock asserts on a flag the *previous* mock only sets after its own internal await, so getProducts only sees cartsSettled === true once getCarts has genuinely finished, not merely been called. Under sequential awaiting that's always true by the time the next mock runs. Under Promise.all([getCarts(), getProducts(), ...]), the array is evaluated left-to-right synchronously, so getProducts's mock body starts running before getCarts has had a chance to resume past its own await and flip its flag; the assertion inside getProducts fails immediately. The internal `await Promise.resolve()` in each mock (before setting its own flag) is what makes that gap observable at all: without it, an async function's body up to its first await runs synchronously, so the flag would already be true the instant the mock is called, regardless of which path called it.
describe("DashboardContentUnoptimized", () => {
  it("awaits getCarts, getProducts, getUsers, getCategories one at a time, never concurrently", async () => {
    let cartsSettled = false;
    let productsSettled = false;
    let usersSettled = false;

    vi.mocked(getCarts).mockImplementation(async () => {
      await Promise.resolve();
      cartsSettled = true;
      return { kpi: {}, salesChart: {} } as Awaited<ReturnType<typeof getCarts>>;
    });

    vi.mocked(getProducts).mockImplementation(async () => {
      expect(cartsSettled).toBe(true);
      await Promise.resolve();
      productsSettled = true;
      return [] as Awaited<ReturnType<typeof getProducts>>;
    });

    vi.mocked(getUsers).mockImplementation(async () => {
      expect(productsSettled).toBe(true);
      await Promise.resolve();
      usersSettled = true;
      return [] as Awaited<ReturnType<typeof getUsers>>;
    });

    vi.mocked(getCategories).mockImplementation(async () => {
      expect(usersSettled).toBe(true);
      return [] as Awaited<ReturnType<typeof getCategories>>;
    });

    await DashboardContentUnoptimized();

    // The chain above only proves *order* among calls that happened; a mock that's never invoked at all (e.g. a request silently dropped from the component) never runs its own assertion and would pass undetected. This closes that gap: all four must have actually fired.
    expect(getCarts).toHaveBeenCalledTimes(1);
    expect(getProducts).toHaveBeenCalledTimes(1);
    expect(getUsers).toHaveBeenCalledTimes(1);
    expect(getCategories).toHaveBeenCalledTimes(1);
  });
});
