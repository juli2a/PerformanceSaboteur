import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { useSidebarStore } from "@/store/sidebar";
import { useSidebarStoreUnstable } from "@/store/sidebar-unstable";

function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  });
}

beforeEach(() => {
  localStorage.clear();
  useSidebarStore.setState({ collapsed: false });
  useSidebarStoreUnstable.setState({ collapsed: false });
  clearCookies();
});

// hooks/useSidebarCollapsed.ts: the stable path seeds store/sidebar.ts with initialCollapsed (the cookie-derived SSR value) once on mount so later re-renders never fall back to the store's hardcoded `false` default; the unstable path just reads store/sidebar-unstable.ts (persist/localStorage) directly with no such protection. setCollapsed always writes both stores plus the cookie, regardless of which mode is currently driving display, so switching the Case 2 toggle mid-session never diverges the user's actual expand/collapse choice.
//
// Note: this hook-level test can't isolate the genuine SSR-hydration race the comment describes (RTL's renderHook does a plain client render, not hydrateRoot, so getServerSnapshot is never actually exercised); that part is already covered by the planned Case 2 E2E scenario in docs/testing-plan.md. What's testable and worthwhile here is the seeding effect's observable result: the shared store ends up holding initialCollapsed, which matters because Header/Sidebar/MainNav all read store/sidebar.ts independently of this hook's own return value.
describe("useSidebarCollapsed", () => {
  it("isUnstable=false: settles on initialCollapsed and seeds store/sidebar.ts with it, not the store's hardcoded false default", () => {
    const { result } = renderHook(() => useSidebarCollapsed(false, true));

    expect(result.current.collapsed).toBe(true);
    expect(useSidebarStore.getState().collapsed).toBe(true);
  });

  it("isUnstable=true: returns the unstable store's value directly, updating immediately when that store changes", () => {
    const { result } = renderHook(() => useSidebarCollapsed(true, false));

    expect(result.current.collapsed).toBe(false);

    act(() => {
      useSidebarStoreUnstable.getState().setCollapsed(true);
    });

    expect(result.current.collapsed).toBe(true);
  });

  it("setCollapsed writes to both the stable and the unstable store, regardless of which one is currently driving display", () => {
    const { result } = renderHook(() => useSidebarCollapsed(true, false));

    act(() => {
      result.current.setCollapsed(true);
    });

    expect(useSidebarStoreUnstable.getState().collapsed).toBe(true);
    expect(useSidebarStore.getState().collapsed).toBe(true);
  });

  it("setCollapsed sets document.cookie to sidebarCollapsed=on/off", () => {
    const { result } = renderHook(() => useSidebarCollapsed(false, false));

    act(() => {
      result.current.setCollapsed(true);
    });
    expect(document.cookie).toContain("sidebarCollapsed=on");

    act(() => {
      result.current.setCollapsed(false);
    });
    expect(document.cookie).toContain("sidebarCollapsed=off");
  });
});
