import { test, expect } from "@playwright/test";

// Not a case scenario, just proves the infrastructure (production build + webServer + baseURL) is actually wired before the real case specs rely on it.
test("dashboard loads against the production server", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveTitle("PerfSaboteur");
});
