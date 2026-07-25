"use client";

import { useState } from "react";
import { CodeXml } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface CaseCodeSectionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  codeBlock?: React.ReactNode;
  tone: "anti" | "best";
}

// Anti-pattern / Best practice block in CaseTipContent. `codeBlock` arrives already server-rendered (see CaseCodeBlock), this component only owns the show/hide interaction, never the highlighting itself.
export default function CaseCodeSection({
  icon,
  label,
  description,
  codeBlock,
  tone,
}: CaseCodeSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isAnti = tone === "anti";

  return (
    <div
      className={cn(
        "rounded-lg border px-3.75 py-3.5",
        isAnti
          ? "border-border bg-white/[2.2%]"
          : "border-[rgba(244,167,60,0.34)] bg-[rgba(244,167,60,0.06)]",
      )}
    >
      <div className="mb-2.25 flex items-center justify-between gap-2.5">
        <span className="flex items-center gap-2 text-brand-text">
          {icon}
          <span className="text-sm font-semibold text-brand-accent">
            {label}
            <span className="text-brand-accent">:</span>
          </span>
        </span>
        {codeBlock && (
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            aria-label={`${isOpen ? "Hide" : "Show"} ${label} code`}
            aria-expanded={isOpen}
            className="shrink-0 cursor-pointer text-brand-muted opacity-65 transition-opacity hover:opacity-100"
          >
            <CodeXml className="size-3.75" />
          </button>
        )}
      </div>
      <p className="leading-[1.55] text-brand-muted">{description}</p>
      {isOpen && codeBlock}
    </div>
  );
}
