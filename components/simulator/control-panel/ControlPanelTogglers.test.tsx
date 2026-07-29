import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ControlPanelTogglers from "@/components/simulator/control-panel/ControlPanelTogglers";
import { useSimControlStore } from "@/store/simulator-control";
import { useOnboardingStore } from "@/store/onboarding";
import { FIRST_CASE_KEY, SECOND_CASE_KEY } from "@/lib/simulator-cases";
import type { CaseKey } from "@/types/simulator";

const PULSE_CLASS = "toggle-cta-border-pulse";

const reload = vi.fn();

beforeEach(() => {
  useSimControlStore.getState().resetToggles();
  useOnboardingStore.setState({
    controlSeen: false,
    guideSeen: false,
    codeSeen: false,
  });
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

// Same row-scoping trick as getSwitchByCaseKey, but for the guide (FileText) button next to the switch.
function getGuideButtonByCaseKey(key: CaseKey): HTMLElement {
  const row = document.querySelector(`[data-case-key="${key}"]`);
  if (!row) throw new Error(`row not found for case key "${key}"`);
  return within(row as HTMLElement).getByRole("button");
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

// The onboarding pulse (store/onboarding.ts) points a first-time visitor at the first case's guide button until they open some guide. Testing this at the store level alone wouldn't catch the component forgetting to call markGuideSeen(), or forgetting the !guideSeen check, so these assert on the actual rendered button.
describe("ControlPanelTogglers onboarding pulse (Guide step)", () => {
  it("shows the pulse on the first case's guide button while guideSeen is false", () => {
    render(<ControlPanelTogglers />);

    expect(getGuideButtonByCaseKey(FIRST_CASE_KEY)).toHaveClass(
      PULSE_CLASS,
    );
  });

  it("does not show the pulse on a different case's guide button", () => {
    render(<ControlPanelTogglers />);

    expect(getGuideButtonByCaseKey(SECOND_CASE_KEY)).not.toHaveClass(
      PULSE_CLASS,
    );
  });

  it("clicking the first case's guide button marks guideSeen and removes the pulse", async () => {
    render(<ControlPanelTogglers />);

    await userEvent.click(getGuideButtonByCaseKey(FIRST_CASE_KEY));

    expect(useOnboardingStore.getState().guideSeen).toBe(true);
    expect(getGuideButtonByCaseKey(FIRST_CASE_KEY)).not.toHaveClass(
      PULSE_CLASS,
    );
  });

  it("clicking the second case's guide button marks guideSeen and removes the pulse as well", async () => {
    render(<ControlPanelTogglers />);

    await userEvent.click(getGuideButtonByCaseKey(SECOND_CASE_KEY));

    expect(useOnboardingStore.getState().guideSeen).toBe(true);
    expect(getGuideButtonByCaseKey(FIRST_CASE_KEY)).not.toHaveClass(
      PULSE_CLASS,
    );
  });

  it("does not show the pulse when guideSeen is already true", () => {
    useOnboardingStore.getState().markGuideSeen();

    render(<ControlPanelTogglers />);

    expect(getGuideButtonByCaseKey(FIRST_CASE_KEY)).not.toHaveClass(
      PULSE_CLASS,
    );
  });
});
