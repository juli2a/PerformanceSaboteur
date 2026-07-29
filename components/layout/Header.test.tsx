import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Header from "@/components/layout/Header";
import { useSimControlStore } from "@/store/simulator-control";
import { useOnboardingStore } from "@/store/onboarding";

const PULSE_CLASS = "toggle-cta-border-pulse";

beforeEach(() => {
  useSimControlStore.getState().resetToggles();
  useSimControlStore.setState({ controlsOpen: false });
  useOnboardingStore.setState({
    controlSeen: false,
    guideSeen: false,
    codeSeen: false,
  });
});

function renderHeader() {
  render(
    <Header
      caseTipContent={{}}
      isLayoutShiftOn={false}
      initialCollapsed={false}
    />,
  );
}

function getControlsButton(): HTMLElement {
  return screen.getByRole("button", { name: "Open simulator controls" });
}

// The Control step only exists on mobile (the button itself is CSS-hidden on desktop via lg:hidden, but stays in the DOM either way, which is what these queries rely on), and is the entry point to the whole onboarding sequence: getting this one wrong would leave a first-time mobile visitor with no pulse anywhere at all.
describe("Header onboarding pulse (Control step)", () => {
  it("shows the pulse on the Controls button while controlSeen is false", () => {
    renderHeader();

    expect(getControlsButton()).toHaveClass(PULSE_CLASS);
  });

  it("tapping the Controls button marks controlSeen and removes the pulse", async () => {
    renderHeader();
    const controlsButton = getControlsButton();

    await userEvent.click(controlsButton);

    // Reuses the reference captured before the click rather than re-querying by role: opening the controls sheet marks the rest of the page inert (aria-hidden), so a fresh getByRole call would no longer find it, even though the node and its classes are unchanged.
    expect(useOnboardingStore.getState().controlSeen).toBe(true);
    expect(controlsButton).not.toHaveClass(PULSE_CLASS);
  });

  it("does not show the pulse when controlSeen is already true", () => {
    useOnboardingStore.getState().markControlSeen();

    renderHeader();

    expect(getControlsButton()).not.toHaveClass(PULSE_CLASS);
  });

  it("still shows the pulse when guideSeen is true but controlSeen is not (each step is independent)", () => {
    useOnboardingStore.getState().markGuideSeen();

    renderHeader();

    expect(getControlsButton()).toHaveClass(PULSE_CLASS);
  });
});
