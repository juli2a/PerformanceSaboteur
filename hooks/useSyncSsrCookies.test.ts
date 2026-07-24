import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSyncSsrCookies } from "@/hooks/useSyncSsrCookies";
import { useSimControlStore } from "@/store/simulator-control";

function setCookie(name: string, value: "on" | "off") {
  document.cookie = `${name}=${value}; path=/`;
}

beforeEach(() => {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  });
  useSimControlStore.getState().resetToggles();
});

// hooks/useSyncSsrCookies.ts: the store always seeds SSR_COOKIE_CASES toggles to `false` (a safe server default). On mount, this hook realigns each one from its actual cookie, since the Server Component already rendered the right variant straight from the cookie and the toggle UI needs to agree with what's actually on screen.
describe("useSyncSsrCookies", () => {
  it("aligns a toggle from the cookie when the cookie and the store disagree (cookie=on, store default false)", () => {
    setCookie("waterfall", "on");
    expect(useSimControlStore.getState().toggles.waterfall).toBe(false);

    renderHook(() => useSyncSsrCookies());

    expect(useSimControlStore.getState().toggles.waterfall).toBe(true);
  });

  it("does not call setToggle when the cookie already matches the store — avoids a wasted re-render", () => {
    setCookie("waterfall", "off");
    const setToggleSpy = vi.spyOn(useSimControlStore.getState(), "setToggle");

    renderHook(() => useSyncSsrCookies());

    expect(setToggleSpy).not.toHaveBeenCalled();
  });
});
