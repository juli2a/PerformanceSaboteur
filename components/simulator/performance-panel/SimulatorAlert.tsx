import { TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface SimulatorAlertProps {
  title: string;
  body: string;
  onDismiss: () => void;
  className?: string;
}

// The stacking/positioning container (Performance Panel on desktop, Web Vitals dock on mobile) owns layout and gap; this component only renders one card.
export default function SimulatorAlert({
  title,
  body,
  onDismiss,
  className,
}: SimulatorAlertProps) {
  return (
    <div role="alert" className={cn("sim-alert", className)}>
      <div className="flex gap-2.5">
        <TriangleAlert
          size={15}
          className="mt-0.25 shrink-0 text-brand-alert"
        />
        <div className="min-w-0">
          <p className="heading-brand-alert">{title}</p>
          <p className="mt-0.75 text-sm font-extralight tracking-wider leading-snug text-brand-alert-muted">
            {body}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="absolute top-2 right-2 text-brand-alert-muted hover:text-brand-text"
      >
        <X size={13} />
      </Button>
    </div>
  );
}
