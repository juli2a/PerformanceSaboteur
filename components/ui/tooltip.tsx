"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
  delay = 100,
  ...props
}: TooltipPrimitive.Trigger.Props) {
  return (
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" delay={delay} {...props} />
  );
}

const tooltipInfoTriggerVariants = cva(
  "inline-flex shrink-0 cursor-help items-center justify-center gap-1 border-0 bg-transparent p-0 outline-none transition-colors",
  {
    variants: {
      color: {
        product:
          "text-text-3 hover:text-foreground focus-visible:text-foreground",
        brand:
          "text-brand-muted hover:text-brand-accent focus-visible:text-brand-accent",
      },
    },
    defaultVariants: {
      color: "product",
    },
  },
);

function TooltipInfoTrigger({
  color,
  className,
  label,
  iconSize = 14,
  children,
  ...props
}: TooltipPrimitive.Trigger.Props &
  VariantProps<typeof tooltipInfoTriggerVariants> & {
    label: string;
    iconSize?: number;
  }) {
  return (
    <TooltipTrigger
      aria-label={label}
      className={cn(tooltipInfoTriggerVariants({ color, className }))}
      {...props}
    >
      {children}
      <InfoIcon size={iconSize} />
    </TooltipTrigger>
  );
}

const tooltipContentVariants = cva(
  "tooltip-glow z-65 max-w-60 rounded px-3 py-2.5 text-sm leading-relaxed whitespace-normal outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
  {
    variants: {
      color: {
        product: "border border-border bg-surface-2 text-text-2",
        brand: "border border-brand-border bg-brand-bg-2 text-brand-text",
      },
    },
    defaultVariants: {
      color: "product",
    },
  },
);

function TooltipContent({
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 8,
  color,
  className,
  ...props
}: TooltipPrimitive.Popup.Props &
  VariantProps<typeof tooltipContentVariants> &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        className="z-65"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(tooltipContentVariants({ color, className }))}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipInfoTrigger, TooltipContent };
