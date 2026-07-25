"use client";

import { useStableTimestamp } from "@/hooks/useStableTimestamp";

interface UpdatedAtProps {
  isHydrationMismatchOn: boolean;
}

// Replaces the dashboard header's "Updated" placeholder, see docs/case6.md (Case 6: Hydration Mismatch).
export default function UpdatedAt({ isHydrationMismatchOn }: UpdatedAtProps) {
  const stable = useStableTimestamp();

  // Case 6 toggle ON (bad path): a plain Date call straight in render, no mount-gating, server and client both run it, on two different clocks. Forcing UTC on the SSR-only branch stands in for what a real deployment already gets for free (server process in UTC vs. the visitor's local timezone); on one dev machine both sides would otherwise share a timezone and the mismatch wouldn't reproduce.
  const unstable =
    typeof window === "undefined"
      ? new Date().toLocaleTimeString("en-US", { timeZone: "UTC" })
      : new Date().toLocaleTimeString("en-US");

  const time = isHydrationMismatchOn ? unstable : stable;

  return (
    <span className="inline-block w-22.5 lg:text-base font-semibold tabular-nums text-foreground">
      {time}
    </span>
  );
}
