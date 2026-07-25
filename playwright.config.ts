import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

// Runs against a production build (`pnpm build` first, then this config's `webServer` runs `pnpm start`) rather than `next dev`; dev compiles each route on demand on first hit, and that compilation latency would land squarely inside the timing thresholds the waterfall (Case 5) and race condition (Case 4) specs assert on.
export default defineConfig({
  testDir: "./e2e",
  // Not fullyParallel: every spec here hits the same single `next start` Node process (webServer below), and two of them (waterfall, race condition) assert on real elapsed time. Running many workers against that one process at once inflates response times past their thresholds under real contention, not a logic bug. One worker trades total runtime for determinism, which is the right trade for a suite this size.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  // Chromium only: these specs assert on logic (SSR cookie state, streaming vs blocking, a real network race, a real hydration mismatch), not on cross-browser rendering, which this project explicitly doesn't test (docs/testing-plan.md, Part 2).
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
    timeout: 60_000,
  },
});
