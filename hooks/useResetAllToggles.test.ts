import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useResetAllToggles } from "@/hooks/useResetAllToggles";
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

// hooks/useResetAllToggles.ts: backs the control panel's "All off" button. Doesn't loop useToggleCase(key, false) over every active case (that would reload once per active SSR_COOKIE_CASES case); instead: one store reset, one batch of cookie writes, and at most one reload.
describe("useResetAllToggles", () => {
  it("with two active SSR_COOKIE_CASES toggles: resets the store, writes both cookies to off, and reloads exactly once (not twice)", () => {
    useSimControlStore.getState().setToggle("imageOptimization", true);
    useSimControlStore.getState().setToggle("waterfall", true);
    const { result } = renderHook(() => useResetAllToggles());

    result.current();

    expect(useSimControlStore.getState().toggles.imageOptimization).toBe(
      false,
    );
    expect(useSimControlStore.getState().toggles.waterfall).toBe(false);
    expect(document.cookie).toContain("imageOptimization=off");
    expect(document.cookie).toContain("waterfall=off");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("with zero active SSR_COOKIE_CASES toggles: resets the store but never reloads", () => {
    useSimControlStore.getState().setToggle("heavyMounting", true);
    const { result } = renderHook(() => useResetAllToggles());

    result.current();

    expect(useSimControlStore.getState().toggles.heavyMounting).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
