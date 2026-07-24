import BugIcon from "@/components/icons/BugIcon";
import { cn } from "@/lib/utils/cn";

const SIZES = {
  md: {
    badgeSize: "size-9.5",
    icon: 21,
    text: "text-[20px]",
    gap: "gap-2.75",
    radius: "rounded-sm",
  },
  sm: {
    badgeSize: "size-7.5",
    icon: 21,
    text: "min-[360px]:text-lg",
    gap: "gap-2.25",
    radius: "rounded-sm",
  },
};

interface LogoProps {
  size?: "sm" | "md";
  // Used in the header's logo zone when the sidebar is collapsed and there's no room for "PerfSaboteur".
  iconOnly?: boolean;
  // Only meaningful where iconOnly toggles at runtime (the header's collapsible logo zone), so the wordmark doesn't appear before the sidebar's width transition has made room for it and overlap the simulator panel.
  animated?: boolean;
}

export default function Logo({
  size = "md",
  iconOnly = false,
  animated = false,
}: LogoProps) {
  const s = SIZES[size];
  return (
    <span className={`flex items-center ${iconOnly ? "" : s.gap}`}>
      <span className={`logo-badge ${s.badgeSize} ${s.radius}`}>
        <BugIcon size={s.icon} />
      </span>
      {!iconOnly && (
        <span
          className={cn(
            `font-brand ${s.text} font-semibold tracking-[-0.3px] text-foreground`,
            animated && "animate-in fade-in-10 duration-600 fill-mode-[both]",
          )}
        >
          Perf<span className="text-brand-muted">Saboteur</span>
        </span>
      )}
    </span>
  );
}
