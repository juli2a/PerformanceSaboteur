"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils/cn";
import { useRenderCounterStore } from "@/store/render-counter";
import type { CaseKey } from "@/types/simulator";

const FLASH_DURATION_MS = 400;

const BASE_CLASS = "border border-transparent transition-all duration-300";
const FLASH_CLASS = cn(
  BASE_CLASS,
  "border-brand-alert shadow-[0_0_10px_4px_rgba(255,129,144,0.45)]",
);

// Highlights component boundaries on every re-render: skips the initial mount (a flash on first paint would just be noise), unconditionally on every render after that. Whether this is one row (good path) or two hundred at once (Case 7's Context Overhead bad path) is entirely a function of how many wrapped components actually re-executed; this component itself doesn't know or care which case is active, only which case's counter to feed (`caseKey`). It feeds that case's slot in the render-counter store, which its own settle-window reporter watches (see hooks/useRerenderNodesReporter.ts); the store itself gates whether an increment counts, so calling it here unconditionally is safe.
//
// The component flashes a border on every re-render of its children via a deps-less useEffect (it fires on every render of this component). The flash is applied by mutating ref.current.className directly, not via useState, because a setState call would itself trigger a re-render, and this effect would fire again on that re-render, incrementing the counter again and restarting the flash, looping forever. A direct DOM mutation causes no re-render, so the effect fires exactly as many times as the children actually re-rendered.
export default function FlashOnUpdate({
  caseKey,
  children,
}: {
  caseKey: CaseKey;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const increment = useRenderCounterStore((state) => state.increment);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    increment(caseKey);

    const node = ref.current;
    if (!node) return;

    clearTimeout(timeoutRef.current);
    node.className = FLASH_CLASS;
    timeoutRef.current = setTimeout(() => {
      node.className = BASE_CLASS;
    }, FLASH_DURATION_MS);
  });

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div ref={ref} className={BASE_CLASS}>
      {children}
    </div>
  );
}
