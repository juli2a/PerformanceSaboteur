import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { X } from "lucide-react";

import CaseCodeSection from "@/components/simulator/control-panel/CaseCodeSection";
import { useOnboardingStore } from "@/store/onboarding";

const PULSE_CLASS = "toggle-cta-border-pulse";

beforeEach(() => {
  useOnboardingStore.setState({
    controlSeen: false,
    guideSeen: false,
    codeSeen: false,
  });
});

// jsdom has no scrollIntoView; CaseCodeSection calls it unconditionally once its code block opens (see the component's own useEffect comment).
Element.prototype.scrollIntoView = () => {};

function renderCaseCodeSection(tone: "anti" | "best") {
  render(
    <CaseCodeSection
      icon={<X className="size-3.75" />}
      label={tone === "anti" ? "Anti-pattern" : "Best practice"}
      description={tone === "anti" ? "bad" : "good"}
      codeBlock={<div>{tone === "anti" ? "bad code" : "good code"}</div>}
      tone={tone}
    />,
  );
}

// The Code-step pulse only ever targets the "Anti-pattern" block (tone="anti"), never "Best practice", regardless of which case's guide it's in, so these render the section directly with each tone rather than going through a real case's full guide content.
describe("CaseCodeSection onboarding pulse (Code step)", () => {
  it("shows the pulse on an anti-pattern's code button while codeSeen is false", () => {
    renderCaseCodeSection("anti");

    expect(screen.getByRole("button")).toHaveClass(PULSE_CLASS);
  });

  it("does not show the pulse on a best-practice code button, even while codeSeen is false", () => {
    renderCaseCodeSection("best");

    expect(screen.getByRole("button")).not.toHaveClass(PULSE_CLASS);
  });

  it("clicking the anti-pattern's code button marks codeSeen and removes the pulse", async () => {
    renderCaseCodeSection("anti");

    await userEvent.click(screen.getByRole("button"));

    expect(useOnboardingStore.getState().codeSeen).toBe(true);
    expect(screen.getByRole("button")).not.toHaveClass(PULSE_CLASS);
  });

  it("clicking the best-practice's code button marks codeSeen and removes the pulse as well", async () => {
    renderCaseCodeSection("anti");
    renderCaseCodeSection("best");

    await userEvent.click(screen.getByLabelText("Show Best practice code"));

    expect(useOnboardingStore.getState().codeSeen).toBe(true);
    expect(screen.getByLabelText("Show Anti-pattern code")).not.toHaveClass(
      PULSE_CLASS,
    );
  });

  it("does not show the pulse when codeSeen is already true", () => {
    useOnboardingStore.getState().markCodeSeen();

    renderCaseCodeSection("anti");

    expect(screen.getByRole("button")).not.toHaveClass(PULSE_CLASS);
  });
});
