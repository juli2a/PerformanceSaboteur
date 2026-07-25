import { getValueRating } from "@/lib/utils/gauge";

// Peak-hold window for a queue: once a degraded/poor sample is shown, it stays on screen for at least this long before the next queued sample replaces it, otherwise a real spike (Long Task / Event Timing data, not fabricated) can flash by and be replaced by a calm number before a human eye registers it. "good" samples are never held; they're applied as soon as their turn in the queue comes up.
export const PEAK_HOLD_MS = 1000;

// A private FIFO queue + timer per call, driven via closure. Samples are never dropped: a burst of bad readings each get their full hold window, one after another, and whatever real (often good) reading arrived during that wait is still sitting in the queue to be shown right after; no synthetic fallback value, only real reported samples ever get applied.
export function createPeakHoldQueue(
  good: number,
  poor: number,
  apply: (value: number) => void,
) {
  const queue: number[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  function step() {
    timer = null;
    const next = queue.shift();
    if (next === undefined) return; // idle: nothing queued, leave as-is
    apply(next);
    const delay =
      getValueRating(next, good, poor) === "good" ? 0 : PEAK_HOLD_MS;
    timer = setTimeout(step, delay);
  }

  return function enqueue(value: number) {
    queue.push(value);
    if (timer === null) timer = setTimeout(step, 0);
  };
}
