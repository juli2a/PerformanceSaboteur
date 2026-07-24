import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useClearAlertsOnNavigate } from "@/hooks/useClearAlertsOnNavigate";
import { useSimControlStore } from "@/store/simulator-control";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

const mockedUsePathname = vi.mocked(usePathname);

beforeEach(() => {
  useSimControlStore.getState().clearAlerts();
  useSimControlStore.getState().triggerAlert("hydrationMismatch");
  mockedUsePathname.mockReturnValue("/dashboard");
});

// hooks/useClearAlertsOnNavigate.ts: clears every shown alert on each pathname change, so one page's alert doesn't keep following the user onto another. But NOT on the first effect run: an SSR-cookie case (e.g. Case 6, Hydration Mismatch) can trigger its alert synchronously during this same page's initial hydration, before this effect ever runs for the first time; an unconditional clear on that first run would wipe the very alert it was meant to survive for.
describe("useClearAlertsOnNavigate", () => {
  it("does not clear alerts on the initial mount, even though the pathname ref just got seeded", () => {
    renderHook(() => useClearAlertsOnNavigate());

    expect(
      useSimControlStore.getState().caseAlerts.hydrationMismatch,
    ).toBe("shown");
  });

  it("does not clear alerts on a re-render where the pathname is unchanged", () => {
    const { rerender } = renderHook(() => useClearAlertsOnNavigate());

    mockedUsePathname.mockReturnValue("/dashboard");
    rerender();

    expect(
      useSimControlStore.getState().caseAlerts.hydrationMismatch,
    ).toBe("shown");
  });

  it("clears alerts once the pathname actually changes between renders", () => {
    const { rerender } = renderHook(() => useClearAlertsOnNavigate());

    mockedUsePathname.mockReturnValue("/products");
    rerender();

    expect(
      useSimControlStore.getState().caseAlerts.hydrationMismatch,
    ).toBeUndefined();
  });
});
