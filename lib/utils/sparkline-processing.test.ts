import { describe, it, expect } from "vitest";
import {
  removeOutliersIterative,
  movingAverage,
  downsampleTo,
  processSparklineHistory,
} from "@/lib/utils/sparkline-processing";
import { deriveRawHistory } from "@/lib/utils/derive";

// See removeOutliersIterative in sparkline-processing.ts for why clamping stops early.
describe("removeOutliersIterative", () => {
  it("leaves data unchanged when nothing is outside the IQR fence", () => {
    // sorted = same; Q1=sorted[1]=11, Q3=sorted[4]=14, IQR=3,
    // fence=[6.5,18.5], every value here is inside it.
    const data = [10, 11, 12, 13, 14, 15];
    expect(removeOutliersIterative(data)).toEqual(data);
  });

  it("clamps a single outlier to the nearest fence boundary over two passes", () => {
    // Pass 1: Q1=11, Q3=14, IQR=3, fence=[6.5,18.5]. 100 is outside → clamped
    // to upper=18.5 (not to the midpoint).
    // Pass 2: sorted=[10,11,12,13,14,18.5] → Q1=11, Q3=14 (same four inner
    // values), fence=[6.5,18.5] again. 18.5 > 18.5 is false → nothing
    // changes, loop stops.
    expect(removeOutliersIterative([10, 11, 12, 13, 14, 100])).toEqual([
      10, 11, 12, 13, 14, 18.5,
    ]);
  });

  it("respects maxPasses: 0 passes leaves even an obvious outlier untouched", () => {
    // Testing maxPasses=1 on data that needs 2 real rounds turned out hard to hand-construct: IQR fences built from a handful of clean values aren't perturbed much by 1-2 large outliers, so a single pass already fully cleans most constructible examples, making a 1-vs-5-pass comparison indistinguishable. maxPasses=0 proves the same guarantee (the loop is genuinely gated by the parameter, not just "runs until settled") more directly: the for-loop condition `pass < maxPasses` is false immediately, so not even one clamp happens.
    const data = [10, 11, 12, 13, 14, 100];
    expect(removeOutliersIterative(data, 0)).toEqual(data);
  });
});

// Trailing moving average over `window` points: at index i, average of up to `window` points ending at i; near the start of the array, before a full window exists yet, it averages whatever is available (0..i).
describe("movingAverage", () => {
  it("warms up at the start of the array, then uses the full window", () => {
    // i0: [1] -> 1
    // i1: [1,2] -> 1.5
    // i2: [1,2,3] -> 2
    // i3: [2,3,4] -> 3
    // i4: [3,4,5] -> 4
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([1, 1.5, 2, 3, 4]);
  });

  it("never reaches a full window when the window exceeds data length", () => {
    // i0: [2] -> 2 ; i1: [2,4] -> 3 ; i2: [2,4,6] -> 4
    expect(movingAverage([2, 4, 6], 7)).toEqual([2, 3, 4]);
  });
});

// Splits data into targetPoints equal buckets via floor(i*bucketSize) .. floor((i+1)*bucketSize), averages and rounds each bucket.
describe("downsampleTo", () => {
  it("averages evenly-sized buckets and rounds with Math.round", () => {
    // bucketSize=2 exactly: [1,2]->1.5->2, [3,4]->3.5->4, [5,6]->5.5->6,
    // [7,8]->7.5->8, [9,10]->9.5->10, [11,12]->11.5->12, [13,14]->13.5->14
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    expect(downsampleTo(data, 7)).toEqual([2, 4, 6, 8, 10, 12, 14]);
  });

  it("splits unevenly (fractional bucketSize) without losing or duplicating points", () => {
    // bucketSize=10/7≈1.4286. Bucket sizes by index: [1,1,2,1,2,1,2], sum 10, every point counted exactly once. This is not a hypothetical edge case: the real pipeline hits 365→7 every time, which is just as uneven.
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    // buckets: [1]->1, [2]->2, [3,4]->3.5->4, [5]->5, [6,7]->6.5->7,
    // [8]->8, [9,10]->9.5->10
    expect(downsampleTo(data, 7)).toEqual([1, 2, 4, 5, 7, 8, 10]);
  });
});

// Full pipeline: cleaned -> smoothed -> downsampled to 7 points. Each stage is already unit-tested above with its own formula; here we only check the contract the whole pipeline promises, that a year of raw daily readings always collapses to exactly 7 points for the mini sparkline, not re-derive exact numbers that no independent doc specifies for the composition as a whole.
describe("processSparklineHistory", () => {
  it("always returns exactly 7 points for a full year of raw daily readings", () => {
    const raw = deriveRawHistory(1, 100, 365);
    expect(processSparklineHistory(raw)).toHaveLength(7);
  });
});
