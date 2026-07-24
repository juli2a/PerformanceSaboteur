import { test, expect } from "@playwright/test";
import { setSsrCookie } from "./helpers";

// docs/case5.md: off streams each section in its own Suspense boundary; on, DashboardContentUnoptimized awaits everything sequentially with no Suspense, so nothing flushes until it's all done. This file checks the two visible consequences (fallback presence, arrival simultaneity); the sequential-vs-concurrent awaiting itself is tested at the call-order level in DashboardContentUnoptimized.test.tsx.
//
// Can't be observed via page.route (these requests are server-side and never reach the browser's network stack). The signal used instead: whether a section's Suspense fallback ever renders, since that only happens when a boundary is actually waiting on something.
//
// Both fallback checks fetch the raw HTML directly (context.request, no browser): fallback markup only enters the response if a boundary exists and its child hadn't resolved when the shell was serialized. The on test's browser-based check (below) separately verifies simultaneity, which raw HTML can't show.
//
// FALLBACK_SECTIONS excludes the banner: every other section has a real 400-800ms delay (lib/server/dashboard.ts) that reliably outlasts shell construction, but the banner has no artificial delay, so it races shell construction on real network timing alone, confirmed empirically to sometimes resolve before the shell serializes, skipping its fallback entirely. That makes fallback presence non-deterministic for the banner, so it's checked via data-section only.
const SECTIONS = [
  "top-products",
  "kpi-grid",
  "sales-chart",
  "analytics-pair",
  "analytics-grid",
] as const;

const FALLBACK_SECTIONS = SECTIONS.filter((s) => s !== "top-products");

test("off: server streams a Suspense fallback for every section but the banner, then every section's resolved content", async ({
  context,
  baseURL,
}) => {
  await setSsrCookie(context, baseURL!, "waterfall", "off");

  // context.request shares this test's BrowserContext (and its cookie jar, already carrying the "off" cookie from setSsrCookie above) without opening a page; response.text() waits for the whole streamed response to finish, so by the time it resolves the concatenated bytes contain both the initial shell (fallbacks that hadn't resolved yet) and every later flush (resolved content + the inline scripts that swap it in).
  const response = await context.request.get("/dashboard");
  const html = await response.text();

  for (const section of FALLBACK_SECTIONS) {
    expect(html).toContain(`data-skeleton="${section}"`);
  }
  for (const section of SECTIONS) {
    expect(html).toContain(`data-section="${section}"`);
  }
});

test("on: server responds with fully-resolved HTML in one flush, no Suspense fallback markup anywhere in it", async ({
  context,
  baseURL,
}) => {
  await setSsrCookie(context, baseURL!, "waterfall", "on");

  // Same context.request approach as the off test above, no browser, no navigation, just the raw bytes the server actually sent. Every section is included here (unlike FALLBACK_SECTIONS in the off test): the banner's shell-serialization race only matters when a Suspense boundary exists to race against; DashboardContentUnoptimized never wraps *anything* in Suspense, banner included, so there's no boundary for any section here to skip a fallback *from*, the absence claim holds unconditionally.
  const response = await context.request.get("/dashboard");
  const html = await response.text();

  for (const section of SECTIONS) {
    expect(html).not.toContain(`data-skeleton="${section}"`);
    expect(html).toContain(`data-section="${section}"`);
  }
});

test("on: every section appears in the same instant", async ({
  page,
  context,
  baseURL,
}) => {
  await setSsrCookie(context, baseURL!, "waterfall", "on");
  await page.goto("/dashboard", { waitUntil: "commit" });

  const contentLocators = SECTIONS.map((section) =>
    page.locator(`[data-section="${section}"]`).first(),
  );

  // Simultaneity, checked separately from the no-fallback-in-the-HTML claim in the previous test: whichever section's content becomes visible first, the rest must already be visible at that exact instant, not eventually, right then, no waiting. This is a distinct claim from "no fallback markup anywhere in the response": a fallback never appearing doesn't by itself prove there's no Suspense boundary at all, a fast-enough resolve can skip a real fallback entirely (confirmed for the banner in the "off" test). If Suspense boundaries were ever reintroduced here and every section happened to resolve fast enough to always skip its own fallback, the previous test would still pass, but those boundaries would let sections stream and paint independently, so this simultaneity check catches it where the no-fallback check couldn't.
  //
  // What none of this distinguishes: whether the four requests inside DashboardContentUnoptimized are awaited sequentially or fired concurrently. That specific claim (true sequential awaiting, the actual thing Case 5's bad path demonstrates) can only be pinned down at the call-order level, not from anything observable in the browser, see DashboardContentUnoptimized.test.tsx, which asserts it deterministically with controlled promises instead of real timers or network.
  await Promise.race(contentLocators.map((l) => l.waitFor({ state: "visible" })));
  for (const locator of contentLocators) {
    expect(await locator.isVisible()).toBe(true);
  }
});
