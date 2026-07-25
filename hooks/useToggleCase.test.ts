import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useToggleCase } from "@/hooks/useToggleCase";
import { useSimControlStore } from "@/store/simulator-control";

const reload = vi.fn();

beforeEach(() => {
  useSimControlStore.getState().resetToggles();
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  });
  reload.mockClear();
  Object.defineProperty(window, "location", {
    value: { ...window.location, reload },
    writable: true,
    configurable: true,
  });
});

// hooks/useToggleCase.ts: every toggle click goes through this instead of calling setToggle directly, so the SSR_COOKIE_CASES cookie+reload side effect lives in one place. For those cases (LCP/CLS/waterfall/hydration, their bug must be visible in the server-rendered HTML), flipping the toggle is meaningless without a real navigation, so the cookie write and reload are unconditional. Every other case is a live client-side demo and needs neither.
describe("useToggleCase", () => {
  it("for an SSR_COOKIE_CASES key: updates the store, writes the cookie, and reloads exactly once", () => {
    const { result } = renderHook(() => useToggleCase());

    result.current("layoutShift", true);

    expect(useSimControlStore.getState().toggles.layoutShift).toBe(true);
    expect(document.cookie).toContain("layoutShift=on");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("for a non-cookie key: updates the store but writes no cookie and never reloads", () => {
    const { result } = renderHook(() => useToggleCase());

    result.current("heavyMounting", true);

    expect(useSimControlStore.getState().toggles.heavyMounting).toBe(true);
    expect(document.cookie).not.toContain("heavyMounting=");
    expect(reload).not.toHaveBeenCalled();
  });
});
