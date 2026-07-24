import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  usePanelExpanded,
  RESTORE_ANIMATION_DELAY_MS,
} from "@/hooks/usePanelExpanded";
import { usePanelExpandedStore } from "@/store/panel-expanded";
import { usePanelExpandedStoreUnstable } from "@/store/panel-expanded-unstable";

function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  usePanelExpandedStore.setState({ expanded: false });
  usePanelExpandedStoreUnstable.setState({ expanded: false });
  clearCookies();
});

afterEach(() => {
  vi.useRealTimers();
});

// hooks/usePanelExpanded.ts: the stable path (mirrors useSidebarCollapsed.ts) seeds store/panel-expanded.ts with initialExpanded once on mount so later re-renders never fall back to the store's hardcoded `false` default. The unstable path additionally carries a second, unrelated RESTORE_ANIMATION_DELAY_MS setTimeout, a guessed fix for a restore animation that wasn't playing, stacked on top of the original Case 2 bug rather than addressing its real cause. setExpanded always writes both stores plus the cookie, regardless of which mode currently drives display.
//
// As in useSidebarCollapsed.test.ts, the pure SSR-hydration snapshot race isn't reproducible through RTL's plain client renderHook (no hydrateRoot), so this only asserts the seeding effect's observable result, not the getServerSnapshot mechanism itself; that's covered by the planned Case 2 E2E scenario.
describe("usePanelExpanded", () => {
  it("isUnstable=false: settles on initialExpanded and seeds store/panel-expanded.ts with it, not the store's hardcoded false default", () => {
    const { result } = renderHook(() => usePanelExpanded(false, true));

    expect(result.current.expanded).toBe(true);
    expect(usePanelExpandedStore.getState().expanded).toBe(true);
  });

  it("isUnstable=true: right after the persisted store changes, before advancing fake timers, the returned expanded value is still the old one", () => {
    const { result } = renderHook(() => usePanelExpanded(true, false));
    expect(result.current.expanded).toBe(false);

    act(() => {
      usePanelExpandedStoreUnstable.getState().setExpanded(true);
    });

    expect(result.current.expanded).toBe(false);
  });

  it("isUnstable=true: after advancing fake timers by RESTORE_ANIMATION_DELAY_MS, the returned expanded value catches up to the persisted store's new value", () => {
    const { result } = renderHook(() => usePanelExpanded(true, false));

    act(() => {
      usePanelExpandedStoreUnstable.getState().setExpanded(true);
    });
    act(() => {
      vi.advanceTimersByTime(RESTORE_ANIMATION_DELAY_MS);
    });

    expect(result.current.expanded).toBe(true);
  });

  it("setExpanded writes to both the stable and the unstable store, regardless of which one is currently driving display", () => {
    const { result } = renderHook(() => usePanelExpanded(true, false));

    act(() => {
      result.current.setExpanded(true);
    });

    expect(usePanelExpandedStoreUnstable.getState().expanded).toBe(true);
    expect(usePanelExpandedStore.getState().expanded).toBe(true);
  });

  it("setExpanded sets document.cookie to panelExpanded=on/off", () => {
    const { result } = renderHook(() => usePanelExpanded(false, false));

    act(() => {
      result.current.setExpanded(true);
    });
    expect(document.cookie).toContain("panelExpanded=on");

    act(() => {
      result.current.setExpanded(false);
    });
    expect(document.cookie).toContain("panelExpanded=off");
  });
});
