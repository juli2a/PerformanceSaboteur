"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSimControlStore } from "@/store/simulator-control";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory Control", Icon: Package },
];

interface MainNavProps {
  onNavigate?: () => void;
  linkClassName?: string;
  // Only the desktop Sidebar (which can collapse) sets this, along with `collapsed`/`setCollapsed` (computed once in Sidebar via useSidebarCollapsed): renders the collapse toggle on the "WORKSPACE" row. MobileDrawer leaves all three unset and always renders the full, uncollapsed nav.
  collapsible?: boolean;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  // Only MobileDrawer sets this: renders an X button, absolutely positioned in the top-right corner of the nearest positioned ancestor (the drawer's fixed <aside>), to close it.
  onClose?: () => void;
}

export default function MainNav({
  onNavigate,
  linkClassName,
  collapsible = false,
  collapsed: collapsedProp = false,
  setCollapsed = () => {},
  onClose,
}: MainNavProps) {
  const pathname = usePathname();
  const collapsed = collapsible && collapsedProp;

  // Nudge to collapse: only makes sense once the sidebar is actually the thing worth collapsing, both it and the guide panel (CaseDetailPanel) open, on a shell too narrow for that (screen width is a simpler proxy for `main` getting squeezed than measuring `main` itself).
  const isGuideOpen = useSimControlStore(
    (state) => state.activeGuideKey !== null,
  );
  const isShellCramped = useMediaQuery("(max-width: 1299.98px)");
  const showCollapsePulse =
    collapsible && !collapsed && isGuideOpen && isShellCramped;

  return (
    <nav className="flex flex-col gap-1.5">
      {onClose && (
        <Button
          variant="outline"
          size="icon"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-heading-gap top-heading-gap"
        >
          <X size={18} />
        </Button>
      )}
      {(!collapsed || collapsible) && (
        <div
          className={cn(
            // h-13 = py-2.5 (20px) + the collapse button's own height (size-8 = 32px), fixed, not just a min, so this row is exactly as tall on mobile (no button, just text) as on desktop, where gap-1.5 alone wouldn't otherwise look the same.
            "flex h-13 items-center py-2.5",
            collapsed ? "justify-center" : "justify-between px-3.5",
          )}
        >
          {!collapsed && (
            <span className="text-[11px] font-semibold tracking-[1px] text-text-3">
              WORKSPACE
            </span>
          )}
          {collapsible && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(showCollapsePulse && "sidebar-collapse-cta-pulse")}
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </Button>
          )}
        </div>
      )}
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={cn(
              // leading-[18px] keeps the label's line box the same height as the icon slot below (size-4.5 = 18px); without it, the label's default text-sm line-height (20px) makes the row taller than the icon-only collapsed row, shifting every item below it down a couple px when the sidebar expands.
              "flex items-center gap-3.25 rounded px-3.5 py-3 text-sm font-medium leading-[18px] transition-colors whitespace-nowrap",
              linkClassName,
              active
                ? "nav-item-active bg-accent-dim font-semibold text-foreground"
                : "text-text-2 hover:bg-raise hover:text-foreground",
            )}
          >
            {/* Fixed-size slot, always left-anchored, so the icon's position never depends on justify-content (which can't transition and would otherwise snap instantly while the sidebar's width is still animating). */}
            <span className="grid size-4.5 shrink-0 place-items-center">
              <Icon
                size={18}
                className={active ? "text-accent" : "text-text-3"}
              />
            </span>
            {!collapsed && (
              <span className="animate-in fade-in-10 duration-600">
                {label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
