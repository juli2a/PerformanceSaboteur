"use client";

import About from "@/components/layout/About";
import MainNav from "@/components/layout/MainNav";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  isLayoutShiftOn: boolean;
  initialCollapsed: boolean;
}

export default function Sidebar({
  isLayoutShiftOn,
  initialCollapsed,
}: SidebarProps) {
  const { collapsed, setCollapsed } = useSidebarCollapsed(
    isLayoutShiftOn,
    initialCollapsed,
  );
  const horizontalPaddingClass = collapsed ? "px-3.5" : "px-heading-gap";

  return (
    <aside
      data-collapsed={collapsed || undefined}
      className={cn(
        "hidden shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-border bg-surface-2 pb-15 transition-[width] duration-280 lg:flex",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "pt-heading-gap transition-[padding] duration-280",
          horizontalPaddingClass,
        )}
      >
        <MainNav
          collapsible
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      <div
        className={cn(
          "mt-auto pb-heading-gap transition-[padding] duration-280",
          horizontalPaddingClass,
        )}
      >
        <About collapsed={collapsed} />
      </div>
    </aside>
  );
}
