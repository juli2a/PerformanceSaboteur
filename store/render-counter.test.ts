import { describe, it, expect, beforeEach } from "vitest";
import { useRenderCounterStore } from "@/store/render-counter";

beforeEach(() => {
  useRenderCounterStore.setState({ counters: {} });
});

// See startTracking/startTrackingIfIdle in store/render-counter.ts: startTracking always resets to a fresh burst (correct when the tracked action is self-contained, Case 7: one checkbox click); startTrackingIfIdle only resets when the key isn't already tracking, so a continuous stream of ticks (Case 8: a slider drag) accumulates into one burst instead of each tick wiping the count.
describe("startTracking vs startTrackingIfIdle", () => {
  it("startTracking always resets to {count:0, isTracking:true}, even over an in-progress count>0", () => {
    useRenderCounterStore.getState().startTracking("contextOverhead");
    useRenderCounterStore.getState().increment("contextOverhead");
    useRenderCounterStore.getState().increment("contextOverhead");

    useRenderCounterStore.getState().startTracking("contextOverhead");

    expect(useRenderCounterStore.getState().counters.contextOverhead).toEqual(
      { count: 0, isTracking: true },
    );
  });

  it("startTrackingIfIdle resets to {count:0, isTracking:true} when idle (no prior entry)", () => {
    useRenderCounterStore.getState().startTrackingIfIdle("brokenMemoization");

    expect(
      useRenderCounterStore.getState().counters.brokenMemoization,
    ).toEqual({ count: 0, isTracking: true });
  });

  it("startTrackingIfIdle leaves an in-progress count untouched when already tracking, the burst-accumulation guarantee", () => {
    useRenderCounterStore.getState().startTrackingIfIdle("brokenMemoization");
    useRenderCounterStore.getState().increment("brokenMemoization");
    useRenderCounterStore.getState().increment("brokenMemoization");
    useRenderCounterStore.getState().increment("brokenMemoization");

    useRenderCounterStore.getState().startTrackingIfIdle("brokenMemoization");

    expect(
      useRenderCounterStore.getState().counters.brokenMemoization,
    ).toEqual({ count: 3, isTracking: true });
  });
});

describe("increment", () => {
  it("increments count by 1 while isTracking is true", () => {
    useRenderCounterStore.getState().startTracking("contextOverhead");

    useRenderCounterStore.getState().increment("contextOverhead");

    expect(
      useRenderCounterStore.getState().counters.contextOverhead?.count,
    ).toBe(1);
  });

  it("is a no-op when isTracking is false for that key", () => {
    useRenderCounterStore.getState().startTracking("contextOverhead");
    useRenderCounterStore.getState().stopTracking("contextOverhead");

    useRenderCounterStore.getState().increment("contextOverhead");

    expect(
      useRenderCounterStore.getState().counters.contextOverhead?.count,
    ).toBe(0);
  });

  it("never touches a different case's counter (keyed isolation)", () => {
    useRenderCounterStore.getState().startTracking("contextOverhead");
    useRenderCounterStore.getState().startTracking("brokenMemoization");

    useRenderCounterStore.getState().increment("contextOverhead");

    expect(
      useRenderCounterStore.getState().counters.brokenMemoization?.count,
    ).toBe(0);
  });
});

describe("stopTracking", () => {
  it("sets isTracking to false while preserving the accumulated count", () => {
    useRenderCounterStore.getState().startTracking("contextOverhead");
    useRenderCounterStore.getState().increment("contextOverhead");
    useRenderCounterStore.getState().increment("contextOverhead");

    useRenderCounterStore.getState().stopTracking("contextOverhead");

    expect(useRenderCounterStore.getState().counters.contextOverhead).toEqual(
      { count: 2, isTracking: false },
    );
  });

  it("is a no-op for a key that was never started, does not create a phantom entry", () => {
    useRenderCounterStore.getState().stopTracking("contextOverhead");

    expect(
      useRenderCounterStore.getState().counters.contextOverhead,
    ).toBeUndefined();
  });
});
