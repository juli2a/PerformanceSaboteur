"use client";

import { useContext, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { getSimulatorCase } from "@/lib/simulator-cases";
import { MediaContext } from "@/context/MediaContext";
import { useSimControlStore } from "@/store/simulator-control";
import type { CaseKey } from "@/types/simulator";

interface CaseDetailPanelProps {
  caseTipContent: Partial<Record<CaseKey, React.ReactNode>>;
}

// Single source for the panel's width, referenced by both the outer (width-animated) and inner (always full-size) wrapper below, so the panel reveals/hides via clipping instead of squishing its own content.
const PANEL_WIDTH_CLASS = "w-[510px]";

// Right-hand slide-out guide, gives a case's guide (incl. code snippets) real room. Lives in the shell's content flex row (app/(shell)/layout.tsx) as a sibling of <main>, so opening it shrinks main instead of overlapping it.
export default function CaseDetailPanel({
  caseTipContent,
}: CaseDetailPanelProps) {
  const isMobile = useContext(MediaContext);
  const activeGuideKey = useSimControlStore((state) => state.activeGuideKey);
  const setActiveGuide = useSimControlStore((state) => state.setActiveGuide);
  const isOpen = activeGuideKey !== null;

  // Keep rendering the last open case's content while the panel slides shut, instead of blanking out the instant activeGuideKey turns null.
  const [displayKey, setDisplayKey] = useState<CaseKey | null>(activeGuideKey);
  if (activeGuideKey !== null && activeGuideKey !== displayKey) {
    setDisplayKey(activeGuideKey);
  }
  const caseInfo = displayKey ? getSimulatorCase(displayKey) : null;

  // This surface doesn't exist on mobile at all, there, a guide's content shows inline inside MobileControlDrawer's own row instead. Without this guard, opening a guide on mobile would also try to slide this panel open underneath the drawer (see PANEL_WIDTH_CLASS above).
  if (isMobile !== false) return null;

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "shrink-0 overflow-hidden transition-[width] duration-340",
        isOpen ? PANEL_WIDTH_CLASS : "w-0",
      )}
    >
      <div
        className={cn(
          "flex h-full flex-col border-l border-brand-border bg-brand-bg",
          PANEL_WIDTH_CLASS,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5.5 py-5">
          <div className="min-w-0">
            <span className="mb-2 flex items-center gap-1.75">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_var(--brand-accent)]" />
              <span className="heading-brand-kicker">SIMULATOR · GUIDE</span>
            </span>
            <p className="truncate text-lg font-semibold tracking-[-0.3px] text-foreground">
              {caseInfo?.label}
            </p>
            {caseInfo && (
              <p className="mt-0.75 text-xs text-brand-muted">
                {caseInfo.zoneTitle} anti-pattern
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setActiveGuide(null)}
            aria-label="Close guide"
            title="Close"
          >
            <X size={15} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5.5 py-heading-gap">
          {displayKey && caseTipContent[displayKey]}
        </div>
        {/* Fixed-height spacer, not scroll padding: it subtracts from the scroll area's own height (flex-1 above), so this strip stays permanently empty regardless of scroll position. Reserves room for the floating CWV widget (PerformancePanel), which sits fixed bottom-right and overlaps this panel's bottom edge rather than pushing it left, see PerformancePanel.tsx. */}
        <div aria-hidden className="h-40 shrink-0" />
      </div>
    </div>
  );
}
