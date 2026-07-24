"use client";

import { FileText, Power, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import { SIMULATOR_CASES } from "@/lib/simulator-cases";
import { useSimControlStore } from "@/store/simulator-control";
import { useSimPerformanceStore } from "@/store/simulator-performance";
import { useToggleCase } from "@/hooks/useToggleCase";
import { useResetAllToggles } from "@/hooks/useResetAllToggles";
import type { CaseKey } from "@/types/simulator";
import SimulatorKicker from "@/components/simulator/control-panel/SimulatorKicker";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseTipContent: Partial<Record<CaseKey, React.ReactNode>>;
}

interface ToggleRowProps {
  caseKey: CaseKey;
  label: string;
  tipContent: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

// Shares activeGuideKey with the desktop guide panel's GuideButton: only one case's info can be open at a time, here or there, so opening a row's info here closes any other row already expanded (and vice versa).
function ToggleRow({
  caseKey,
  label,
  tipContent,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  const isInfoOpen = useSimControlStore(
    (state) => state.activeGuideKey === caseKey,
  );
  const setActiveGuide = useSimControlStore((state) => state.setActiveGuide);

  return (
    <div
      data-case-key={caseKey}
      className={cn(
        "overflow-hidden rounded border transition-colors",
        checked
          ? "border-brand-border bg-brand-accent-dim"
          : "border-border bg-transparent",
      )}
    >
      <label className="flex items-center gap-4 px-3.5 py-3">
        <span className="flex-1 font-semibold text-foreground">{label}</span>
        <button
          type="button"
          onClick={() => setActiveGuide(isInfoOpen ? null : caseKey)}
          aria-label={`${label} info`}
          aria-expanded={isInfoOpen}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-xs border p-0 transition-colors",
            isInfoOpen
              ? "border-brand-accent bg-brand-accent text-brand-bg"
              : "border-border text-brand-muted",
          )}
        >
          <FileText className="size-4" />
        </button>
        <Switch
          color="brand"
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
      </label>
      {isInfoOpen && (
        <div className="px-3.5 pb-3 text-[15px] leading-[1.4] text-text-2">
          {tipContent}
        </div>
      )}
    </div>
  );
}

export default function MobileControlDrawer({
  open,
  onOpenChange,
  caseTipContent,
}: Props) {
  const toggles = useSimControlStore((state) => state.toggles);
  const toggleCase = useToggleCase();
  const resetAllToggles = useResetAllToggles();
  const allOff = Object.values(toggles).every((value) => !value);
  // The mobile Performance Panel is always forced open (and thus at its tallest) while this drawer is open, and sits on top of this drawer's own bottom edge; reserving the same height as bottom padding keeps the last toggle rows reachable by scrolling instead of stuck behind it.
  const mobilePanelHeight = useSimPerformanceStore(
    (state) => state.mobilePanelHeight,
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent bottomOffset={mobilePanelHeight}>
        <DrawerHeader>
          <SimulatorKicker size="lg" />
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={allOff}
              onClick={resetAllToggles}
              aria-label="Turn all simulator toggles off"
            >
              <Power size={13} />
              All off
            </Button>
            <DrawerClose
              render={
                <Button variant="outline" size="icon-sm" aria-label="Close" />
              }
            >
              <X size={18} />
            </DrawerClose>
          </div>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-4.5 px-4.5 py-3.5">
          {SIMULATOR_CASES.map((zone) => (
            <div key={zone.title} className="flex flex-col gap-2.25">
              <span className="heading-brand-group">{zone.title}</span>
              {zone.items.map((item) => (
                <ToggleRow
                  key={item.key}
                  caseKey={item.key}
                  label={item.label}
                  tipContent={caseTipContent[item.key]}
                  checked={toggles[item.key]}
                  onCheckedChange={(checked) => toggleCase(item.key, checked)}
                />
              ))}
            </div>
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
