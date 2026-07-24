import { describe, it, expect } from "vitest";
import { getGaugePercent } from "@/lib/utils/gauge";

// docs/ui.md "Floating Performance Panel": the ring fill is not linear. 0 → poorThreshold maps to 0-75%, beyond the threshold it asymptotically approaches 100% without ever reaching it, so the ring keeps showing forward motion even at very poor values.
describe("getGaugePercent", () => {
  it("returns 0 at value 0", () => {
    expect(getGaugePercent(0, 100)).toBe(0);
  });

  it("returns 0 for a negative value", () => {
    expect(getGaugePercent(-10, 100)).toBe(0);
  });

  it("maps the pre-threshold range linearly to 0-75%", () => {
    // 50/100 * 75 = 37.5
    expect(getGaugePercent(50, 100)).toBe(37.5);
  });

  it("returns exactly 75% right at the threshold boundary", () => {
    // value === poorThreshold still uses the <= branch (linear), not the asymptotic one; the boundary where an off-by-one would first show up.
    expect(getGaugePercent(100, 100)).toBe(75);
  });

  it("keeps growing past the threshold via the asymptotic branch", () => {
    // 75 + 25 * (1 - 100/200) = 75 + 12.5 = 87.5
    expect(getGaugePercent(200, 100)).toBe(87.5);
  });

  it("never reaches 100% no matter how far past the threshold", () => {
    expect(getGaugePercent(100_000, 100)).toBeLessThan(100);
    expect(getGaugePercent(100_000, 100)).toBeCloseTo(99.975, 3);
  });
});
