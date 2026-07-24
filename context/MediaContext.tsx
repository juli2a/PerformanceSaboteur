"use client";

import { createContext, useEffect } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const MOBILE_QUERY = "(max-width: 1023.98px)";

export const MediaContext = createContext<boolean | undefined>(undefined);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);

  // Mirrored into a cookie purely so PerformancePanel.tsx can render its real branch during SSR instead of waiting for this to resolve client-side (Case 2 / CLS mobile, see docs/case2.md). MediaContext itself stays undefined-until-resolved for every other consumer (ProductTable, CategoryFilter, ...), deliberately not changed, since seeding isMobile globally would also change when/how those render.
  useEffect(() => {
    if (isMobile !== undefined) {
      document.cookie = `isMobile=${isMobile ? "on" : "off"}; path=/; max-age=31536000`;
    }
  }, [isMobile]);

  return (
    <MediaContext.Provider value={isMobile}>{children}</MediaContext.Provider>
  );
}
