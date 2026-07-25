import { test, expect, type Page } from "@playwright/test";
import { getSimulatorCase } from "@/lib/simulator-cases";

const alertTitle = getSimulatorCase("raceCondition").alert.title;

// docs/case4.md. Bad path (hooks/useInventorySearch.ts, runBadPath): every keystroke fires its own request immediately, no debounce, no AbortController, and the API route (app/api/inventory-search/route.ts) deliberately delays SHORT queries longer than long ones (`Math.max(200, 1500 - (query.length - 1) * 260)` ms). Typed at a realistic pace, the very first keystroke ("l", 1 char) carries the longest delay and so resolves dead last, after the correct "lipstick" response has already arrived and been shown, and overwrites the table with its own (much broader, wrong) match. Good path (runGoodPath): a debounce (DEBOUNCE_MS) plus an AbortController that cancels every earlier in-flight request means only the final keystroke's request ever resolves, so this can't happen.
//
// This isn't a re-test of hooks/useInventorySearch.test.ts (step 4, unit coverage of the hook via msw with a controlled resolve order), it proves the same race is real when a genuine user types into the genuine DOM against the genuine network.

async function toggleRaceCondition(page: Page) {
  await page.locator('[data-case-key="raceCondition"]').getByRole("switch").click();
}

async function rowTexts(page: Page): Promise<string[]> {
  return page
    .locator('[role="row"]')
    .filter({ has: page.locator('[role="cell"]') })
    .allTextContents();
}

test("off: debounce + abort keep the table in sync with the input", async ({
  page,
}) => {
  await page.goto("/inventory");
  await page
    .locator('[data-section="inventory-search"]')
    .pressSequentially("lipstick", { delay: 90 });

  // 300ms debounce + the route's own artificial delay (down to ~200ms for an 8-char query) + real network overhead to DummyJSON, generous margin.
  await page.waitForTimeout(1500);

  const rows = await rowTexts(page);
  expect(rows.length).toBeGreaterThan(0);
  for (const text of rows) {
    expect(text.toLowerCase()).toContain("lipstick");
  }
  await expect(
    page.getByRole("alert").filter({ hasText: alertTitle }),
  ).toHaveCount(0);
});

test("on: a stale response overwrites the table and raises the Race Condition alert", async ({
  page,
}) => {
  await page.goto("/inventory");
  await toggleRaceCondition(page);

  const input = page.locator('[data-section="inventory-search"]');
  await input.pressSequentially("lipstick", { delay: 90 });

  // The first keystroke ("l") carries the ~1500ms artificial delay and is sent right at the start of this sequence; wait well past that so its stale response has had time to land and overwrite the table.
  await page.waitForTimeout(2200);

  await expect(
    page.getByRole("alert").filter({ hasText: alertTitle }),
  ).toBeVisible();
  await expect(input).toHaveValue("lipstick");

  // Proves the table is showing the stale, broader "l" match rather than "lipstick" itself: at least one visible row is some other product, not literally "lipstick". This relies on DummyJSON's real catalog having more than one product matching "l"/"li" alongside "lipstick", an assumption any version of this check has to make, since if "lipstick" were the only match for either query, a stale response couldn't be told apart from a correct one by any observation of the table.
  const rows = await rowTexts(page);
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.some((text) => !text.toLowerCase().includes("lipstick"))).toBe(
    true,
  );
});
