"use client";

import { Fragment } from "react";
import { FileText, Power } from "lucide-react";

import EdgeScroller from "@/components/ui/edge-scroller";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import { SIMULATOR_CASES } from "@/lib/simulator-cases";
import { useSimControlStore } from "@/store/simulator-control";
import { useToggleCase } from "@/hooks/useToggleCase";
import { useResetAllToggles } from "@/hooks/useResetAllToggles";
import type { CaseKey } from "@/types/simulator";

interface GuideButtonProps {
  caseKey: CaseKey;
  label: string;
}

// Opens this case's guide in the right-hand slide-out panel (CaseDetailPanel).
function GuideButton({ caseKey, label }: GuideButtonProps) {
  const isActive = useSimControlStore(
    (state) => state.activeGuideKey === caseKey,
  );
  const setActiveGuide = useSimControlStore((state) => state.setActiveGuide);

  return (
    <button
      type="button"
      onClick={() => setActiveGuide(isActive ? null : caseKey)}
      aria-label={`${isActive ? "Hide" : "Show"} guide: ${label}`}
      aria-expanded={isActive}
      className={cn(
        "inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-xs border border-transparent outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        isActive
          ? "border-brand-accent bg-brand-accent text-brand-bg"
          : "text-brand-muted hover:border-brand-border hover:bg-brand-accent-dim hover:text-brand-accent",
      )}
    >
      <FileText size={13} />
    </button>
  );
}

export default function ControlPanelTogglers() {
  const toggles = useSimControlStore((state) => state.toggles);
  const toggleCase = useToggleCase();
  const resetAllToggles = useResetAllToggles();
  const allOff = Object.values(toggles).every((value) => !value);

  return (
    <>
      <EdgeScroller
        scrollLeftLabel="Scroll controls left"
        scrollRightLabel="Scroll controls right"
      >
        {SIMULATOR_CASES.map((zone, index) => (
          <Fragment key={zone.title}>
            {index > 0 && (
              <>
                <span className="min-w-5 flex-1 shrink-0" />
                <span className="mr-4 w-px shrink-0 self-stretch bg-brand-border" />
              </>
            )}
            <fieldset className="m-0 shrink-0 border-0 p-0">
              <legend className="heading-brand-group mb-1.75 p-0">
                {zone.title}
              </legend>
              <div className="grid grid-flow-col grid-rows-2 gap-x-4.5 gap-y-2.25">
                {zone.items.map((item) => (
                  <div
                    key={item.key}
                    data-case-key={item.key}
                    className="flex items-center gap-1.75"
                  >
                    <Switch
                      color="brand"
                      size="sm"
                      checked={toggles[item.key]}
                      onCheckedChange={(checked) =>
                        toggleCase(item.key, checked)
                      }
                    />
                    <span className="whitespace-nowrap text-[15px] font-medium text-text-2">
                      {item.label}
                    </span>
                    <GuideButton caseKey={item.key} label={item.label} />
                  </div>
                ))}
              </div>
            </fieldset>
          </Fragment>
        ))}
        <span className="min-w-5 flex-1 shrink-0" />
      </EdgeScroller>
      <span className="mx-4 w-px shrink-0 self-stretch bg-brand-border" />
      <Button
        variant="outline"
        size="sm"
        disabled={allOff}
        onClick={resetAllToggles}
        aria-label="Turn all simulator toggles off"
        className="shrink-0"
      >
        <Power size={13} />
        All off
      </Button>
    </>
  );
}
