import { Check, Lightbulb, X } from "lucide-react";

import type { CaseTip } from "@/lib/simulator-cases";
import CaseCodeSection from "@/components/simulator/control-panel/CaseCodeSection";
import TryItToggleButton from "@/components/simulator/control-panel/TryItToggleButton";
import type { CaseKey } from "@/types/simulator";

interface CaseTipContentProps {
  caseKey: CaseKey;
  tip: CaseTip;
  // Already server-rendered by CaseCodeBlock (see lib/server/case-info.tsx); undefined means that case has no snippet on disk yet.
  badCodeBlock?: React.ReactNode;
  goodCodeBlock?: React.ReactNode;
}

interface TipSectionProps {
  title: string;
  body: string;
  action?: React.ReactNode;
}

function TipSection({ title, body, action }: TipSectionProps) {
  return (
    <div>
      <div className="mb-1.75 flex min-h-6 items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-foreground">
          {title}
          <span className="text-brand-accent">:</span>
        </p>
        {action}
      </div>
      <p className="leading-[1.6] text-brand-muted">{body}</p>
    </div>
  );
}

// Renders a case's tip (problem / reproduction / effect / anti-pattern / best practice / summary), shared between the desktop right-hand guide panel (CaseDetailPanel) and the mobile Drawer's info panel (MobileControlDrawer) so both surfaces show identical content.
export default function CaseTipContent({
  caseKey,
  tip,
  badCodeBlock,
  goodCodeBlock,
}: CaseTipContentProps) {
  return (
    <div className="flex flex-col gap-heading-gap text-base">
      <TipSection title="Problem" body={tip.problem} />
      <TipSection
        title="Try it"
        body={tip.reproduction}
        action={<TryItToggleButton caseKey={caseKey} />}
      />
      <TipSection title="You'll see" body={tip.effect} />
      <CaseCodeSection
        icon={<X className="size-3.75" />}
        label="Anti-pattern"
        description={tip.badCode}
        codeBlock={badCodeBlock}
        tone="anti"
      />
      <CaseCodeSection
        icon={<Check className="size-3.75" />}
        label="Best practice"
        description={tip.goodCode}
        codeBlock={goodCodeBlock}
        tone="best"
      />
      <div className="h-px bg-brand-border" />
      <div className="flex items-start gap-2.75">
        <Lightbulb className="mt-px size-4 shrink-0 text-brand-accent" />
        <p className="font-medium leading-[1.55] text-brand-accent">
          {tip.summary}
        </p>
      </div>
    </div>
  );
}
