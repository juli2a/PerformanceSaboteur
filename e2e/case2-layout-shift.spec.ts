import { test, expect } from "@playwright/test";
import { setSsrCookie } from "./helpers";

// docs/case2.md + app/(shell)/layout.tsx: `sidebarCollapsed` is only honored server-side when `layoutShift` is off. When `layoutShift` is on, the server pretends it has no cookie at all (initialCollapsed forced to false), simulating the real bug, where the collapse state only lives in localStorage and the server has no way to read it. So the lever that reproduces the bug is `layoutShift`, not `sidebarCollapsed` itself; `sidebarCollapsed=on` below is a fixed precondition ("the user had already collapsed the sidebar on an earlier visit"), not the thing under test.
//
// Checked via a raw HTTP fetch of the SSR response (not page.goto + reading the DOM afterwards) so there's no risk of the assertion racing client-side hydration: this is exactly the first byte the server sent, nothing else.
//
// components/layout/Sidebar.tsx renders `data-collapsed={collapsed || undefined}` on the <aside>, added specifically so state like this has an explicit, stable marker instead of tests (or anything else) having to infer it from a presentational width class, which is free to change for pure design reasons unrelated to this case's logic.
test("layoutShift=off: first SSR HTML honors sidebarCollapsed and renders collapsed", async ({
  context,
  baseURL,
}) => {
  await setSsrCookie(context, baseURL!, "sidebarCollapsed", "on");
  await setSsrCookie(context, baseURL!, "layoutShift", "off");

  const response = await context.request.get(`${baseURL}/dashboard`);
  const html = await response.text();

  expect(html).toContain("data-collapsed");
});

test("layoutShift=on: first SSR HTML ignores sidebarCollapsed and renders expanded", async ({
  context,
  baseURL,
}) => {
  await setSsrCookie(context, baseURL!, "sidebarCollapsed", "on");
  await setSsrCookie(context, baseURL!, "layoutShift", "on");

  const response = await context.request.get(`${baseURL}/dashboard`);
  const html = await response.text();

  expect(html).not.toContain("data-collapsed");
});

// docs/case2.md, "Mobile version": the exact same cookie-vs-localStorage mechanism as the sidebar above, just for PerformancePanelMobile's expanded/collapsed height instead of the sidebar's width. `panelExpanded` is the fixed precondition here (mirrors `sidebarCollapsed` above); `layoutShift` is again the lever, components/simulator/performance-panel/PerformancePanel.tsx (via app/(shell)/layout.tsx) forces `initialExpanded: false` whenever `layoutShift` is on, the same pattern as the sidebar.
//
// components/simulator/performance-panel/PerformancePanelMobile.tsx renders `data-panel-open={open || undefined}` on `.sim-panel-mobile-content`; React omits an `undefined` attribute from the HTML entirely, so its mere presence/absence in the raw SSR response is itself the expanded/collapsed signal, no pixel heights to compare.

test("layoutShift=off + isMobile=on: first SSR HTML honors panelExpanded and renders it open", async ({
  context,
  baseURL,
}) => {
  await setSsrCookie(context, baseURL!, "isMobile", "on");
  await setSsrCookie(context, baseURL!, "panelExpanded", "on");
  await setSsrCookie(context, baseURL!, "layoutShift", "off");

  const response = await context.request.get(`${baseURL}/dashboard`);
  const html = await response.text();

  expect(html).toContain("data-panel-open");
});

test("layoutShift=on + isMobile=on: first SSR HTML ignores panelExpanded and renders it collapsed", async ({
  context,
  baseURL,
}) => {
  await setSsrCookie(context, baseURL!, "isMobile", "on");
  await setSsrCookie(context, baseURL!, "panelExpanded", "on");
  await setSsrCookie(context, baseURL!, "layoutShift", "on");

  const response = await context.request.get(`${baseURL}/dashboard`);
  const html = await response.text();

  expect(html).not.toContain("data-panel-open");
});

// docs/case2.md: "confirmed via curl: sim-panel-mobile never appears in any server response, with any cookie combination". Without the `isMobile` cookie, PerformancePanel.tsx (`isMobile === undefined`) returns null server-side rather than guessing; the panel only ever mounts client-side once MediaContext's real matchMedia resolves. Not a copy of the two tests above, a different branch (whether the component participates in SSR at all, not which state it renders).
test("without isMobile cookie: the mobile panel is absent from SSR entirely", async ({
  context,
  baseURL,
}) => {
  const response = await context.request.get(`${baseURL}/dashboard`);
  const html = await response.text();

  expect(html).not.toContain("sim-panel-mobile");
});
