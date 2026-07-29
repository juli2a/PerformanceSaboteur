import { describe, it, expect, beforeEach } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MobileControlDrawer from "@/components/simulator/control-panel/MobileControlDrawer";
import { useSimControlStore } from "@/store/simulator-control";
import { useOnboardingStore } from "@/store/onboarding";
import { FIRST_CASE_KEY, SECOND_CASE_KEY } from "@/lib/simulator-cases";
import type { CaseKey } from "@/types/simulator";

const PULSE_CLASS = "toggle-cta-border-pulse";

beforeEach(() => {
  useSimControlStore.getState().resetToggles();
  useSimControlStore.setState({ activeGuideKey: null });
  useOnboardingStore.setState({
    controlSeen: false,
    guideSeen: false,
    codeSeen: false,
  });
});

// Same row-scoping trick as ControlPanelTogglers.test.tsx's getSwitchByCaseKey: the row's own info button is the only <button> in it besides the Switch (role="switch", not "button").
function getInfoButtonByCaseKey(key: CaseKey): HTMLElement {
  const row = document.querySelector(`[data-case-key="${key}"]`);
  if (!row) throw new Error(`row not found for case key "${key}"`);
  return within(row as HTMLElement).getByRole("button");
}

function renderOpenDrawer() {
  render(
    <MobileControlDrawer open onOpenChange={() => {}} caseTipContent={{}} />,
  );
}

// Mirrors ControlPanelTogglers' Guide-step pulse tests, but for the mobile drawer's own info button, since the two surfaces wire markGuideSeen independently and either one could be left unwired by mistake.
describe("MobileControlDrawer onboarding pulse (Guide step)", () => {
  it("shows the pulse on the first case's info button while guideSeen is false", () => {
    renderOpenDrawer();

    expect(getInfoButtonByCaseKey(FIRST_CASE_KEY)).toHaveClass(
      PULSE_CLASS,
    );
  });

  it("does not show the pulse on a different case's info button", () => {
    renderOpenDrawer();

    expect(getInfoButtonByCaseKey(SECOND_CASE_KEY)).not.toHaveClass(
      PULSE_CLASS,
    );
  });

  it("tapping the first case's info button marks guideSeen and removes the pulse", async () => {
    renderOpenDrawer();

    await userEvent.click(getInfoButtonByCaseKey(FIRST_CASE_KEY));

    expect(useOnboardingStore.getState().guideSeen).toBe(true);
    expect(getInfoButtonByCaseKey(FIRST_CASE_KEY)).not.toHaveClass(
      PULSE_CLASS,
    );
  });

  it("tapping the second case's info button marks guideSeen and removes the pulse as well", async () => {
    renderOpenDrawer();

    await userEvent.click(getInfoButtonByCaseKey(SECOND_CASE_KEY));

    expect(useOnboardingStore.getState().guideSeen).toBe(true);
    expect(getInfoButtonByCaseKey(FIRST_CASE_KEY)).not.toHaveClass(
      PULSE_CLASS,
    );
  });

  it("does not show the pulse when guideSeen is already true", () => {
    useOnboardingStore.getState().markGuideSeen();

    renderOpenDrawer();

    expect(getInfoButtonByCaseKey(FIRST_CASE_KEY)).not.toHaveClass(
      PULSE_CLASS,
    );
  });
});
