import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createPeakHoldQueue,
  PEAK_HOLD_MS,
} from "@/lib/utils/peak-hold-queue";

// good=100, poor=300 throughout: 50/60 are "good", 200 is "degraded", 400/410/420 are "poor" (per lib/utils/gauge.ts's getValueRating).
describe("createPeakHoldQueue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("applies a single good value once, almost immediately, then goes idle", () => {
    const apply = vi.fn();
    const enqueue = createPeakHoldQueue(100, 300, apply);

    enqueue(50);
    vi.runAllTimers();

    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(50);
  });

  it("applies a single poor value immediately too, the hold only delays the NEXT value, not the first", () => {
    const apply = vi.fn();
    const enqueue = createPeakHoldQueue(100, 300, apply);

    enqueue(400);
    vi.advanceTimersByTime(0);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(400);
  });

  it("holds a degraded value on screen for at least PEAK_HOLD_MS before applying the next queued value", () => {
    const apply = vi.fn();
    const enqueue = createPeakHoldQueue(100, 300, apply);

    // Both queued synchronously, before any timer has a chance to fire.
    enqueue(200);
    enqueue(400);

    vi.advanceTimersByTime(0);
    expect(apply).toHaveBeenNthCalledWith(1, 200);
    expect(apply).toHaveBeenCalledTimes(1); // 400 must still be waiting

    vi.advanceTimersByTime(PEAK_HOLD_MS - 1);
    expect(apply).toHaveBeenCalledTimes(1); // 1ms short of the hold window

    vi.advanceTimersByTime(1);
    expect(apply).toHaveBeenNthCalledWith(2, 400);
    expect(apply).toHaveBeenCalledTimes(2);
  });

  it("gives each value in a burst of poor readings its own full hold window, in FIFO order, dropping none", () => {
    const apply = vi.fn();
    const enqueue = createPeakHoldQueue(100, 300, apply);

    enqueue(400);
    enqueue(410);
    enqueue(420);

    vi.advanceTimersByTime(0);
    expect(apply).toHaveBeenNthCalledWith(1, 400);

    vi.advanceTimersByTime(PEAK_HOLD_MS);
    expect(apply).toHaveBeenNthCalledWith(2, 410);

    vi.advanceTimersByTime(PEAK_HOLD_MS);
    expect(apply).toHaveBeenNthCalledWith(3, 420);

    expect(apply).toHaveBeenCalledTimes(3);
  });

  it("does not let a value that arrives mid-hold jump the queue early", () => {
    const apply = vi.fn();
    const enqueue = createPeakHoldQueue(100, 300, apply);

    enqueue(400);
    vi.advanceTimersByTime(0);
    expect(apply).toHaveBeenCalledTimes(1); // 400 applied, hold now running

    vi.advanceTimersByTime(PEAK_HOLD_MS / 2); // halfway through the hold
    enqueue(50); // fresh good reading arrives mid-hold
    expect(apply).toHaveBeenCalledTimes(1); // must not apply early

    vi.advanceTimersByTime(PEAK_HOLD_MS / 2 - 1);
    expect(apply).toHaveBeenCalledTimes(1); // still 1ms short

    vi.advanceTimersByTime(1);
    expect(apply).toHaveBeenNthCalledWith(2, 50);
    expect(apply).toHaveBeenCalledTimes(2);
  });

  it("wakes back up correctly after the queue drains and goes idle", () => {
    const apply = vi.fn();
    const enqueue = createPeakHoldQueue(100, 300, apply);

    enqueue(50);
    vi.runAllTimers();
    expect(apply).toHaveBeenCalledTimes(1);

    enqueue(60);
    vi.runAllTimers();
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply).toHaveBeenNthCalledWith(2, 60);
  });
});
