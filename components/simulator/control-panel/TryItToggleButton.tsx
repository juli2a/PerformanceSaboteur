"use client";

import { useSimControlStore } from "@/store/simulator-control";
import { useToggleCase } from "@/hooks/useToggleCase";
import { Button } from "@/components/ui/button";
import type { CaseKey } from "@/types/simulator";

interface TryItToggleButtonProps {
  caseKey: CaseKey;
}

// Lets a reader flip this case's own toggle on right from its guide, instead of hunting for it back in the control panel. Renders nothing once the toggle is already on: turning it on is this button's only job.
export default function TryItToggleButton({ caseKey }: TryItToggleButtonProps) {
  const isOn = useSimControlStore((state) => state.toggles[caseKey]);
  const toggleCase = useToggleCase();

  if (isOn) return null;

  return (
    <Button
      variant="brand"
      size="xs"
      className="toggle-cta-border-pulse"
      onClick={() => toggleCase(caseKey, true)}
    >
      Toggle On
    </Button>
  );
}
