import * as React from "react";

import { cn } from "@/lib/utils/cn";

function Card({
  className,
  variant = "default",
  size = "default",
  disabled,
  as: Component = "section",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "global" | "default";
  size?: "default" | "kpi";
  disabled?: boolean;
  as?: "section" | "div";
}) {
  return (
    <Component
      data-slot="card"
      data-size={variant === "global" ? size : undefined}
      className={cn(
        variant === "global" ? "card-surface-bg card-global" : "card-default",
        disabled && "opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Card };
