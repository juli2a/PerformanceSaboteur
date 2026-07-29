import { describe, it, expect, beforeEach } from "vitest";
import { useOnboardingStore } from "@/store/onboarding";

beforeEach(() => {
  useOnboardingStore.setState({
    controlSeen: false,
    guideSeen: false,
    codeSeen: false,
  });
});

//all three true only exists to avoid a flash of the pulse on every reload for a returning visitor, while this middleware is still reading localStorage. `merge` is what decides the value actually used once that read completes, so it (not the default) is what determines whether a given visitor ever sees onboarding at all.
describe("persist: merge", () => {
  const { merge } = useOnboardingStore.persist.getOptions();

  it("merge: with persistedState undefined (first visit), returns all three flags as false", () => {
    const currentState = useOnboardingStore.getState();

    const result = merge!(undefined, currentState) as ReturnType<
      typeof useOnboardingStore.getState
    >;

    expect(result).toMatchObject({
      controlSeen: false,
      guideSeen: false,
      codeSeen: false,
    });
  });

  it("merge: with a persisted blob of all-true, keeps all three flags true", () => {
    const currentState = useOnboardingStore.getState();
    const persistedState = {
      controlSeen: true,
      guideSeen: true,
      codeSeen: true,
    };

    const result = merge!(persistedState, currentState) as ReturnType<
      typeof useOnboardingStore.getState
    >;

    expect(result).toMatchObject({
      controlSeen: true,
      guideSeen: true,
      codeSeen: true,
    });
  });

  it("merge: with a persisted blob mid-sequence, preserves each flag's own value", () => {
    const currentState = useOnboardingStore.getState();
    const persistedState = {
      controlSeen: true,
      guideSeen: false,
      codeSeen: false,
    };

    const result = merge!(persistedState, currentState) as ReturnType<
      typeof useOnboardingStore.getState
    >;

    expect(result).toMatchObject({
      controlSeen: true,
      guideSeen: false,
      codeSeen: false,
    });
  });
});

describe("markControlSeen", () => {
  it("sets controlSeen to true, leaves guideSeen and codeSeen untouched", () => {
    useOnboardingStore.getState().markControlSeen();

    expect(useOnboardingStore.getState()).toMatchObject({
      controlSeen: true,
      guideSeen: false,
      codeSeen: false,
    });
  });

  it("is a no-op (same state reference) when called again", () => {
    useOnboardingStore.getState().markControlSeen();
    const stateAfterFirstCall = useOnboardingStore.getState();

    useOnboardingStore.getState().markControlSeen();

    expect(useOnboardingStore.getState()).toBe(stateAfterFirstCall);
  });
});

describe("markGuideSeen", () => {
  it("sets guideSeen to true, leaves controlSeen and codeSeen untouched", () => {
    useOnboardingStore.getState().markGuideSeen();

    expect(useOnboardingStore.getState()).toMatchObject({
      controlSeen: false,
      guideSeen: true,
      codeSeen: false,
    });
  });

  it("is a no-op (same state reference) when called again", () => {
    useOnboardingStore.getState().markGuideSeen();
    const stateAfterFirstCall = useOnboardingStore.getState();

    useOnboardingStore.getState().markGuideSeen();

    expect(useOnboardingStore.getState()).toBe(stateAfterFirstCall);
  });
});

describe("markCodeSeen", () => {
  it("sets codeSeen to true, leaves controlSeen and guideSeen untouched", () => {
    useOnboardingStore.getState().markCodeSeen();

    expect(useOnboardingStore.getState()).toMatchObject({
      controlSeen: false,
      guideSeen: false,
      codeSeen: true,
    });
  });

  it("is a no-op (same state reference) when called again", () => {
    useOnboardingStore.getState().markCodeSeen();
    const stateAfterFirstCall = useOnboardingStore.getState();

    useOnboardingStore.getState().markCodeSeen();

    expect(useOnboardingStore.getState()).toBe(stateAfterFirstCall);
  });
});
