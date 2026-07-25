import { describe, it, expect, beforeEach } from "vitest";
import { useSimControlStore } from "@/store/simulator-control";
import type { SimControlState } from "@/types/simulator";

beforeEach(() => {
  useSimControlStore.getState().resetToggles();
  useSimControlStore.getState().clearAlerts();
});

// See triggerAlert in store/simulator-control.ts. When the key is already "shown", the updater returns the same `state` object reference instead of a new one, so Zustand's setState short-circuits and never notifies subscribers, a deliberate guard against a wasted re-render on a re-trigger that changes nothing.
describe("caseAlerts lifecycle", () => {
  it("triggerAlert sets an untriggered key to 'shown'", () => {
    useSimControlStore.getState().triggerAlert("imageOptimization");
    expect(useSimControlStore.getState().caseAlerts.imageOptimization).toBe(
      "shown",
    );
  });

  it("triggerAlert on an already-'shown' key is a no-op, returns the same state reference, not just the same value", () => {
    useSimControlStore.getState().triggerAlert("imageOptimization");
    const before = useSimControlStore.getState();

    useSimControlStore.getState().triggerAlert("imageOptimization");
    const after = useSimControlStore.getState();

    expect(after).toBe(before);
  });

  it("triggerAlert on a 'dismissed' key flips it back to 'shown'", () => {
    useSimControlStore.getState().triggerAlert("imageOptimization");
    useSimControlStore.getState().dismissAlert("imageOptimization");

    useSimControlStore.getState().triggerAlert("imageOptimization");

    expect(useSimControlStore.getState().caseAlerts.imageOptimization).toBe(
      "shown",
    );
  });

  it("dismissAlert sets status to 'dismissed', keeping the key present", () => {
    useSimControlStore.getState().triggerAlert("imageOptimization");
    useSimControlStore.getState().dismissAlert("imageOptimization");

    expect(useSimControlStore.getState().caseAlerts.imageOptimization).toBe(
      "dismissed",
    );
  });

  it("closeAlert removes the key entirely, unlike dismissAlert", () => {
    useSimControlStore.getState().triggerAlert("imageOptimization");
    useSimControlStore.getState().closeAlert("imageOptimization");

    expect(
      "imageOptimization" in useSimControlStore.getState().caseAlerts,
    ).toBe(false);
  });
});

// See SSR_COOKIE_CASES in store/simulator-control.ts: imageOptimization, layoutShift, waterfall and hydrationMismatch must show up correctly in server-rendered HTML on first load, so their source of truth is a cookie, not localStorage; partialize strips them out of the persisted blob, and merge always resolves them from the cookie-seeded currentState rather than the stored one. Every other toggle stays localStorage-backed as usual.
describe("persist: partialize/merge, SSR_COOKIE_CASES vs localStorage", () => {
  const { partialize, merge } = useSimControlStore.persist.getOptions();

  it("partialize strips all four SSR_COOKIE_CASES keys out of the persisted toggles blob", () => {
    const allOn = useSimControlStore.getState();
    const persisted = partialize!(allOn) as { toggles: Record<string, boolean> };

    expect(persisted.toggles).not.toHaveProperty("imageOptimization");
    expect(persisted.toggles).not.toHaveProperty("layoutShift");
    expect(persisted.toggles).not.toHaveProperty("waterfall");
    expect(persisted.toggles).not.toHaveProperty("hydrationMismatch");
  });

  it("partialize keeps all four non-cookie keys in the persisted toggles blob", () => {
    const state = useSimControlStore.getState();
    const persisted = partialize!(state) as { toggles: Record<string, boolean> };

    expect(persisted.toggles).toHaveProperty("heavyMounting");
    expect(persisted.toggles).toHaveProperty("raceCondition");
    expect(persisted.toggles).toHaveProperty("contextOverhead");
    expect(persisted.toggles).toHaveProperty("brokenMemoization");
  });

  // merge itself has no special case for SSR_COOKIE_CASES, it blindly spreads persisted.toggles over currentState.toggles for whatever keys are present. The "cookie always wins" guarantee only holds because partialize already stripped waterfall out of whatever got saved to localStorage, so it's never actually present in a real persistedState. Feeding merge a fabricated persistedState.waterfall directly (bypassing partialize) tests an input that can never occur in the real app, so here partialize and merge run in the same sequence the browser really uses: a previous session's full state goes through partialize first, and *that* stripped blob is what merge receives.
  it("merge: for a cookie case, the cookie-seeded currentState value wins, because partialize already stripped it from the persisted blob (previous session had waterfall=true, this load's cookie says false)", () => {
    const previousSession = {
      ...useSimControlStore.getState(),
      toggles: { ...useSimControlStore.getState().toggles, waterfall: true },
    };
    const persistedState = partialize!(previousSession);

    const currentState = {
      ...useSimControlStore.getState(),
      toggles: { ...useSimControlStore.getState().toggles, waterfall: false },
    };
    const result = merge!(persistedState, currentState) as SimControlState;

    expect(result.toggles.waterfall).toBe(false);
  });

  it("merge: for a cookie case, the cookie-seeded currentState value wins, reverse direction (previous session had waterfall=false, this load's cookie says true), to rule out 'current always wins for everything'", () => {
    const previousSession = {
      ...useSimControlStore.getState(),
      toggles: { ...useSimControlStore.getState().toggles, waterfall: false },
    };
    const persistedState = partialize!(previousSession);

    const currentState = {
      ...useSimControlStore.getState(),
      toggles: { ...useSimControlStore.getState().toggles, waterfall: true },
    };
    const result = merge!(persistedState, currentState) as SimControlState;

    expect(result.toggles.waterfall).toBe(true);
  });

  it("merge: for a non-cookie case, the persisted (localStorage) value wins over currentState", () => {
    const currentState = {
      ...useSimControlStore.getState(),
      toggles: {
        ...useSimControlStore.getState().toggles,
        heavyMounting: false,
      },
    };
    const persistedState = { toggles: { heavyMounting: true } };

    const result = merge!(persistedState, currentState) as SimControlState;

    expect(result.toggles.heavyMounting).toBe(true);
  });

  it("merge: with persisted.toggles === undefined (first-ever visit, nothing in localStorage yet), falls back entirely to currentState.toggles without throwing", () => {
    const currentState = useSimControlStore.getState();

    const result = merge!({}, currentState) as SimControlState;

    expect(result.toggles).toEqual(currentState.toggles);
  });
});
