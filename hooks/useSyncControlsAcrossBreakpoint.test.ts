import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MediaContext } from "@/context/MediaContext";
import { useSyncControlsAcrossBreakpoint } from "@/hooks/useSyncControlsAcrossBreakpoint";
import { useSimControlStore } from "@/store/simulator-control";

let contextValue: boolean | undefined;

function Wrapper({ children }: { children: ReactNode }) {
  return createElement(MediaContext.Provider, { value: contextValue }, children);
}

beforeEach(() => {
  useSimControlStore.getState().setActiveGuide(null);
  useSimControlStore.getState().setControlsOpen(false);
});

// hooks/useSyncControlsAcrossBreakpoint.ts: entering mobile with an already-active guide must force the controls sheet open (otherwise the guide has nowhere to show); entering desktop always closes it (no desktop equivalent to stay open in). Guarded by wasMobileRef (only real breakpoint changes act, not every render) and an explicit no-op while isMobile is still undefined (SSR "not yet known" state).
//
// Asserted via useSimControlStore.getState().controlsOpen rather than spying on setControlsOpen: vi.spyOn on a Zustand action leaks across `it` blocks in this file (Zustand copies the function reference into every new state object on `set()`, so vi.restoreAllMocks() can't reach the copy already propagated into the store's current state), a test-construction problem, not a bug in the hook. Where a test needs to prove "no call happened" (not just "the end value happens to match"), it presets controlsOpen to a sentinel value the real branch would never produce, so an unchanged sentinel after the transition proves the hook took no action.
describe("useSyncControlsAcrossBreakpoint", () => {
  it("desktop -> mobile with an active guide: opens the controls sheet", () => {
    useSimControlStore.getState().setActiveGuide("waterfall");
    contextValue = false;
    const { rerender } = renderHook(() => useSyncControlsAcrossBreakpoint(), {
      wrapper: Wrapper,
    });

    contextValue = true;
    rerender();

    expect(useSimControlStore.getState().controlsOpen).toBe(true);
  });

  it("desktop -> mobile with no active guide: does not call setControlsOpen (no guide to show)", () => {
    useSimControlStore.getState().setControlsOpen(true); // sentinel
    contextValue = false;
    const { rerender } = renderHook(() => useSyncControlsAcrossBreakpoint(), {
      wrapper: Wrapper,
    });

    contextValue = true;
    rerender();

    expect(useSimControlStore.getState().controlsOpen).toBe(true);
  });

  it("mobile -> desktop: always closes the controls sheet, even with an active guide", () => {
    useSimControlStore.getState().setActiveGuide("waterfall");
    useSimControlStore.getState().setControlsOpen(true); // sentinel: sheet already open
    contextValue = true;
    const { rerender } = renderHook(() => useSyncControlsAcrossBreakpoint(), {
      wrapper: Wrapper,
    });

    contextValue = false;
    rerender();

    expect(useSimControlStore.getState().controlsOpen).toBe(false);
  });

  it("isMobile stays undefined across renders: never touches setControlsOpen (SSR guard)", () => {
    useSimControlStore.getState().setControlsOpen(true); // sentinel
    contextValue = undefined;
    const { rerender } = renderHook(() => useSyncControlsAcrossBreakpoint(), {
      wrapper: Wrapper,
    });

    rerender();

    expect(useSimControlStore.getState().controlsOpen).toBe(true);
  });

  it("isMobile unchanged between re-renders: does not call setControlsOpen again (wasMobileRef guard)", () => {
    useSimControlStore.getState().setActiveGuide("waterfall");
    contextValue = false;
    const { rerender } = renderHook(() => useSyncControlsAcrossBreakpoint(), {
      wrapper: Wrapper,
    });

    contextValue = true;
    rerender();
    expect(useSimControlStore.getState().controlsOpen).toBe(true);

    // Simulate the user manually closing the sheet, independent of the breakpoint hook. If the guard is broken, the next no-op re-render (isMobile still true) would re-run the mobile+guide branch and force it back open.
    useSimControlStore.getState().setControlsOpen(false);
    rerender();

    expect(useSimControlStore.getState().controlsOpen).toBe(false);
  });
});
