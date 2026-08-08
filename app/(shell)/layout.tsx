import { cookies, headers } from "next/headers";
import { CSPProvider } from "@base-ui/react/csp-provider";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import CaseDetailPanel from "@/components/simulator/control-panel/CaseDetailPanel";
import PerformancePanel from "@/components/simulator/performance-panel/PerformancePanel";
import { getCaseTipContent } from "@/lib/server/case-info";

// Shell layout: Header (with mobile drawer) + Sidebar (desktop) + CaseDetailPanel + PerformancePanel
export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const desktopCaseTipContent = getCaseTipContent("desktop");
  const mobileCaseTipContent = getCaseTipContent("mobile");

  // Base UI injects its own <style> tags for things like scrollbar-hiding (Select's list, ScrollArea), which happen outside Next's rendering pipeline and so never pick up its auto-nonce. CSPProvider is Base UI's own mechanism for this: everything it renders internally reads the nonce from here instead, so style-src-elem can stay nonce-only in proxy.ts with no 'unsafe-inline' carve-out. Lives here rather than the root layout since this layout already reads cookies() below and is unconditionally dynamic, so this costs nothing extra, and it keeps the root layout (and anything outside this shell, e.g. not-found) free to stay static.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  // Case 2 (Layout Shift): on means the sidebar collapse state has no
  // cookie at all (localStorage-only), so the server can't know it — pretend
  // it doesn't, same as the real broken implementation would.
  const cookieStore = await cookies();
  const isLayoutShiftOn = cookieStore.get("layoutShift")?.value === "on";
  const initialSidebarCollapsed = isLayoutShiftOn
    ? false
    : cookieStore.get("sidebarCollapsed")?.value === "on";
  const initialPanelExpanded = isLayoutShiftOn
    ? false
    : cookieStore.get("panelExpanded")?.value === "on";
  // Not gated by isLayoutShiftOn — device type isn't part of the "bad"
  // mechanism, it's just what lets PerformancePanel take part in SSR at
  // all. See context/MediaContext.tsx for where this cookie is written.
  const initialIsMobile =
    cookieStore.get("isMobile")?.value === "on"
      ? true
      : cookieStore.get("isMobile")?.value === "off"
        ? false
        : undefined;

  return (
    <CSPProvider nonce={nonce}>
      <div className="flex min-h-dvh flex-col lg:h-full">
        <Header
          caseTipContent={mobileCaseTipContent}
          isLayoutShiftOn={isLayoutShiftOn}
          initialCollapsed={initialSidebarCollapsed}
          initialIsMobile={initialIsMobile}
        />
        <div className="flex flex-1 lg:overflow-hidden">
          <Sidebar
            isLayoutShiftOn={isLayoutShiftOn}
            initialCollapsed={initialSidebarCollapsed}
          />
          <main className="@container flex-1 pb-[var(--mobile-panel-h,0px)] lg:overflow-auto lg:pb-0">
            {children}
          </main>
          <CaseDetailPanel caseTipContent={desktopCaseTipContent} />
        </div>
        <PerformancePanel
          isLayoutShiftOn={isLayoutShiftOn}
          initialExpanded={initialPanelExpanded}
          initialIsMobile={initialIsMobile}
        />
      </div>
    </CSPProvider>
  );
}
