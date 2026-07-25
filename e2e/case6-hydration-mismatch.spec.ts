import { test, expect, type Page } from "@playwright/test";
import { setSsrCookie } from "./helpers";
import {
  HYDRATION_MISMATCH_SIGNATURE_DEV,
  HYDRATION_MISMATCH_SIGNATURE_PROD,
} from "@/components/simulator/performance-panel/SimulatorEffects";
import { getSimulatorCase } from "@/lib/simulator-cases";

const alertTitle = getSimulatorCase("hydrationMismatch").alert.title;

// docs/case6.md: the "bad" clock (components/dashboard/UpdatedAt.tsx) forces UTC on the server and reads the browser's own timezone on the client. If the machine running this test happened to already be in UTC (typical for CI), server and client would agree even on the bad path and the mismatch would never reproduce, so every test in this file runs in a fixed non-UTC zone, the same guarantee the app's own code gets from forcing UTC server-side.
test.use({ timezoneId: "Europe/Kyiv" });

const HYDRATION_ERROR_SIGNATURES = [
  HYDRATION_MISMATCH_SIGNATURE_DEV,
  HYDRATION_MISMATCH_SIGNATURE_PROD,
];

function collectHydrationErrors(page: Page): string[] {
  const messages: string[] = [];
  page.on("console", (msg) => messages.push(msg.text()));
  page.on("pageerror", (err) => messages.push(err.message));
  return messages;
}

test("off: no hydration mismatch, no console error", async ({
  page,
  context,
  baseURL,
}) => {
  await setSsrCookie(context, baseURL!, "hydrationMismatch", "off");
  const messages = collectHydrationErrors(page);

  await page.goto("/dashboard");
  await page.waitForTimeout(1000); // give a real mismatch time to throw, if any

  await expect(
    page.getByRole("alert").filter({ hasText: alertTitle }),
  ).toHaveCount(0);
  expect(
    messages.some((m) =>
      HYDRATION_ERROR_SIGNATURES.some((sig) => m.includes(sig)),
    ),
  ).toBe(false);
});

test("on: hydration mismatch alert appears and a real hydration error is logged", async ({
  page,
  context,
  baseURL,
}) => {
  await setSsrCookie(context, baseURL!, "hydrationMismatch", "on");
  const messages = collectHydrationErrors(page);

  await page.goto("/dashboard");

  await expect(
    page.getByRole("alert").filter({ hasText: alertTitle }),
  ).toBeVisible();
  await expect
    .poll(() =>
      messages.some((m) =>
        HYDRATION_ERROR_SIGNATURES.some((sig) => m.includes(sig)),
      ),
    )
    .toBe(true);
});
