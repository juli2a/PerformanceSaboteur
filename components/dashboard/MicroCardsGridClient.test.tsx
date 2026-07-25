import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

import type { AnalyticCardData } from "@/types/analytics";
import { MicroCardsGridClient } from "@/components/dashboard/MicroCardsGridClient";
import { useSimControlStore } from "@/store/simulator-control";
import { useRenderCounterStore } from "@/store/render-counter";

function makeCard(id: string, marginality: number): AnalyticCardData {
  return {
    id,
    meta: { title: `Product ${id}`, sku: `SKU-${id}` },
    metrics: { currentValue: 1000, rating: 4 },
    marginality,
    rawHistory: Array.from({ length: 30 }, (_, i) => 10 + i),
  };
}

// Case 8 (brokenMemoization): a card is "low margin" when its marginality (GM%) is below the slider's current threshold, lowMargin = marginality < threshold. Three cards at 5%, 15%, 25%; moving the slider 10 -> 20 flips only the 15% card's lowMargin (false -> true), the 5% and 25% cards keep the same flag. On the good path (MicroCard, stable primitive props) memo should skip the two unchanged cards and re-render only the flipped one. On the bad path (MicroCardUnoptimized, fresh `{...card}` every render) memo never skips anything, so all three re-render regardless of which one's visual state actually changed.
const cards = [makeCard("a", 5), makeCard("b", 15), makeCard("c", 25)];

beforeEach(() => {
  useSimControlStore.getState().resetToggles();
  useRenderCounterStore.setState({ counters: {} });
});

// A card's element is found via its own title text, not by index or by `data-slot="card"` (PopoverTrigger's `render` prop takes over the Card element it's given and overwrites its `data-slot` to "popover-trigger"), so the `data-low-margin` attribute Case 8 sets via `disabled`/`lowMargin` actually lands on `[data-slot="popover-trigger"]`, not on a `[data-slot="card"]`; the only element with that data-slot is MicroCardsGridClient's own outer wrapper Card, several DOM levels up, so it would resolve to the same element regardless of which title you started from.
function isLowMargin(title: string): boolean {
  const card = screen.getByText(title).closest('[data-slot="popover-trigger"]');
  if (!card) throw new Error(`card not found for "${title}"`);
  return card.getAttribute("data-low-margin") === "true";
}

describe("MicroCardsGridClient (Case 8)", () => {
  it("good path (memo, stable props): only the card whose lowMargin flipped re-renders", () => {
    useSimControlStore.getState().setToggle("brokenMemoization", false);
    render(<MicroCardsGridClient products={cards} />);

    // Before moving the slider (threshold=10): only the 5% card is low margin, 5<10 true, 15<10 false, 25<10 false.
    expect(isLowMargin("Product a")).toBe(true);
    expect(isLowMargin("Product b")).toBe(false);
    expect(isLowMargin("Product c")).toBe(false);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "20" } });

    expect(useRenderCounterStore.getState().counters.brokenMemoization?.count).toBe(
      1,
    );

    // After moving to threshold=20: the 15% card flips to low margin too, 5<20 true (unchanged), 15<20 true (flipped), 25<20 false (unchanged).
    expect(isLowMargin("Product a")).toBe(true);
    expect(isLowMargin("Product b")).toBe(true);
    expect(isLowMargin("Product c")).toBe(false);
  });

  it("bad path (fresh object every render): all three cards re-render", () => {
    useSimControlStore.getState().setToggle("brokenMemoization", true);
    render(<MicroCardsGridClient products={cards} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "20" } });

    expect(useRenderCounterStore.getState().counters.brokenMemoization?.count).toBe(
      3,
    );
  });
});
