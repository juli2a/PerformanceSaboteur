import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useRerenderNodesReporter,
  SETTLE_DELAY_MS,
} from "@/hooks/useRerenderNodesReporter";
import { useRenderCounterStore } from "@/store/render-counter";
import { useSimPerformanceStore } from "@/store/simulator-performance";
import { useSimControlStore } from "@/store/simulator-control";

beforeEach(() => {
  vi.useFakeTimers();
  useRenderCounterStore.setState({ counters: {} });
  useSimPerformanceStore.setState({ rerenderedNodes: {} });
  useSimControlStore.getState().clearAlerts();
});

afterEach(() => {
  vi.useRealTimers();
});

// hooks/useRerenderNodesReporter.ts: watches a case's render-counter entry while it's tracking, restarting a SETTLE_DELAY_MS timer on every increment. Only once the burst settles (SETTLE_DELAY_MS without a new increment) does it publish the total via setRerenderedNodes and decide triggerAlert vs closeAlert based on whether the final count clears alertThreshold, strictly greater than, not greater-or-equal.
//
// Asserted via useSimPerformanceStore.getState().rerenderedNodes and useSimControlStore.getState().caseAlerts rather than spying on the actions: vi.spyOn on a Zustand action leaks across `it` blocks in this file the same way it did in useSyncControlsAcrossBreakpoint.test.ts (see that file's comment), a test-construction issue, not a hook bug.
describe("useRerenderNodesReporter", () => {
  it("does not publish before the burst settles, then publishes the final count once it does — not per intermediate increment", () => {
    useRenderCounterStore.getState().startTracking("contextOverhead");
    renderHook(() => useRerenderNodesReporter("contextOverhead", 5));

    act(() => {
      useRenderCounterStore.getState().increment("contextOverhead");
    });
    act(() => {
      vi.advanceTimersByTime(SETTLE_DELAY_MS / 2);
    });
    act(() => {
      useRenderCounterStore.getState().increment("contextOverhead");
    });
    act(() => {
      vi.advanceTimersByTime(SETTLE_DELAY_MS / 2);
    });
    act(() => {
      useRenderCounterStore.getState().increment("contextOverhead");
    });
    act(() => {
      vi.advanceTimersByTime(SETTLE_DELAY_MS / 2);
    });
    expect(
      useSimPerformanceStore.getState().rerenderedNodes.contextOverhead,
    ).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(SETTLE_DELAY_MS / 2);
    });
    expect(
      useSimPerformanceStore.getState().rerenderedNodes.contextOverhead,
    ).toBe(3);
  });

  it("count above alertThreshold after settling: shows the alert", () => {
    useRenderCounterStore.getState().startTracking("contextOverhead");
    renderHook(() => useRerenderNodesReporter("contextOverhead", 5));

    act(() => {
      for (let i = 0; i < 6; i++) {
        useRenderCounterStore.getState().increment("contextOverhead");
      }
    });
    act(() => {
      vi.advanceTimersByTime(SETTLE_DELAY_MS);
    });

    expect(useSimControlStore.getState().caseAlerts.contextOverhead).toBe(
      "shown",
    );
  });

  it("count exactly equal to alertThreshold after settling: closes an already-shown alert (boundary is > not >=)", () => {
    useSimControlStore.getState().triggerAlert("contextOverhead");
    useRenderCounterStore.getState().startTracking("contextOverhead");
    renderHook(() => useRerenderNodesReporter("contextOverhead", 5));

    act(() => {
      for (let i = 0; i < 5; i++) {
        useRenderCounterStore.getState().increment("contextOverhead");
      }
    });
    act(() => {
      vi.advanceTimersByTime(SETTLE_DELAY_MS);
    });

    expect(
      useSimControlStore.getState().caseAlerts.contextOverhead,
    ).toBeUndefined();
  });

  it("isTracking false: never publishes, even after advancing timers well past 100ms", () => {
    renderHook(() => useRerenderNodesReporter("contextOverhead", 5));

    act(() => {
      vi.advanceTimersByTime(SETTLE_DELAY_MS * 10);
    });

    expect(
      useSimPerformanceStore.getState().rerenderedNodes.contextOverhead,
    ).toBeUndefined();
  });
});
