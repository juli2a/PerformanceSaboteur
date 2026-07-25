import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ControlPanelTogglers from "@/components/simulator/control-panel/ControlPanelTogglers";
import { useSimControlStore } from "@/store/simulator-control";
import type { CaseKey } from "@/types/simulator";

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

// The Switch and its label span are siblings, not wired via <label>/aria-labelledby, so getByRole with a `name` won't find them; scope to the row via its data-case-key instead (ControlPanelTogglers.tsx puts it on the same <div> as the Switch, one per SIMULATOR_CASES item).
function getSwitchByCaseKey(key: CaseKey): HTMLElement {
  const row = document.querySelector(`[data-case-key="${key}"]`);
  if (!row) throw new Error(`row not found for case key "${key}"`);
  return within(row as HTMLElement).getByRole("switch");
}

// ControlPanelTogglers wires clicks to useToggleCase (already fully tested at hook level in hooks/useToggleCase.test.ts, including the cookie+reload side effect). What's untested is the wiring itself: does clicking a given case's Switch actually call it with that case's key, and does the Switch reflect the store's current value back as `checked`.
describe("ControlPanelTogglers", () => {
  it("clicking an SSR_COOKIE_CASES toggle (layoutShift) updates the store and reloads once", async () => {
    render(<ControlPanelTogglers />);

    await userEvent.click(getSwitchByCaseKey("layoutShift"));

    expect(useSimControlStore.getState().toggles.layoutShift).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("clicking a non-cookie toggle (Heavy mounting) updates the store without reloading", async () => {
    render(<ControlPanelTogglers />);

    await userEvent.click(getSwitchByCaseKey("heavyMounting"));

    expect(useSimControlStore.getState().toggles.heavyMounting).toBe(true);
    expect(reload).not.toHaveBeenCalled();
  });

  it("reflects an already-on toggle from the store as checked", () => {
    useSimControlStore.getState().setToggle("heavyMounting", true);

    render(<ControlPanelTogglers />);

    expect(getSwitchByCaseKey("heavyMounting")).toBeChecked();
  });
});
