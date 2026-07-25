"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cva, type VariantProps } from "class-variance-authority";
import { InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

const popoverInfoTriggerVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none transition-colors",
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

function PopoverInfoTrigger({
  color,
  className,
  label,
  ...props
}: PopoverPrimitive.Trigger.Props &
  VariantProps<typeof popoverInfoTriggerVariants> & {
    label: string;
  }) {
  return (
    <PopoverTrigger
      aria-label={label}
      className={cn(popoverInfoTriggerVariants({ color, className }))}
      {...props}
    >
      <InfoIcon size={13} />
    </PopoverTrigger>
  );
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />;
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

const popoverContentVariants = cva(
  "z-50 max-h-(--available-height) origin-(--transform-origin) overflow-y-auto rounded-lg duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 text-sm",
  {
    variants: {
      color: {
        product:
          "bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
        brand: "border border-brand-border bg-brand-bg-3 text-text-2 shadow-md",
      },
      size: {
        default: "min-w-56 p-4",
        // Used by content with several labeled sections (e.g. CaseTipContent) that needs more room than the default compact popover.
        lg: "w-175 px-8 py-6",
      },
    },
    defaultVariants: {
      color: "product",
      size: "default",
    },
  },
);

function PopoverContent({
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 8,
  color,
  size,
  className,
  ...props
}: PopoverPrimitive.Popup.Props &
  VariantProps<typeof popoverContentVariants> &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PopoverPortal>
      <PopoverPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(popoverContentVariants({ color, size, className }))}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPortal>
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverInfoTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverClose,
};
