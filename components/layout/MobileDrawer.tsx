"use client";

import { useContext } from "react";
import About from "@/components/layout/About";
import MainNav from "@/components/layout/MainNav";
import { MediaContext } from "@/context/MediaContext";
import { useSimPerformanceStore } from "@/store/simulator-performance";

interface Props {
  open: boolean;
  onClose: () => void;
  initialIsMobile?: boolean;
}

export default function MobileDrawer({
  open,
  onClose,
  initialIsMobile,
}: Props) {
  // The mobile Performance Panel floats fixed at the bottom of the viewport (above this drawer, z-60 vs z-41); stopping the drawer's own bottom edge at the panel's current height (collapsed or expanded, via the same store MobileControlDrawer reads for its bottomOffset) keeps About reachable instead of hidden behind it.
  const mobilePanelHeight = useSimPerformanceStore(
    (state) => state.mobilePanelHeight,
  );

  // Desktop-hidden used to mean CSS-transformed off-canvas, still mounted and still in the tab order. Real unmount (mirroring CaseDetailPanel's desktop-only gate, inverted) keeps its nav links/About out of reach entirely once the breakpoint says desktop.
  const isMobile = useContext(MediaContext) ?? initialIsMobile;
  if (isMobile !== true) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-[rgba(4,6,10,0.62)] backdrop-blur-sm transition-opacity duration-250"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />

      {/* Drawer starts below the header (h-[60px] on mobile/tablet), not at the very top, so it doesn't duplicate the header's own logo. */}
      <aside
        className="fixed left-0 top-[60px] z-41 flex w-71.5 flex-col overflow-x-hidden border-r border-border bg-surface-2 p-heading-gap shadow-[10px_0_44px_rgba(0,0,0,0.5)] transition-transform duration-280 ease-[cubic-bezier(0.2,0.7,0.3,1)]"
        style={{
          bottom: mobilePanelHeight,
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <MainNav
          onNavigate={onClose}
          onClose={onClose}
          linkClassName="text-[15px]"
        />

        <div className="mt-auto">
          <About />
        </div>
      </aside>
    </>
  );
}
