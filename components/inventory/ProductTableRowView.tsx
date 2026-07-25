"use client";

import Image from "next/image";

import type { AmplifiedProduct, LogisticStatus } from "@/types/inventory";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getStatusTone } from "@/lib/utils/inventory";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import FlashOnUpdate from "@/components/simulator/FlashOnUpdate";

interface ProductTableRowViewProps {
  product: AmplifiedProduct;
  gridTemplateColumns: string;
  isSelected: boolean;
  logisticStatus: LogisticStatus;
  onToggleSelected: () => void;
}

// Shared markup for ProductTableRow (good path, Zustand selector) and ProductTableRowUnoptimized (Case 7 bad path, Context), identical in both, since the only thing that case demonstrates is *how* isSelected / onToggleSelected are sourced upstream, not how the row looks. Keeping that one difference in the two callers and the shared rendering (plus the single FlashOnUpdate wrap) here avoids maintaining two copies of markup that must stay in lockstep.
export default function ProductTableRowView({
  product,
  gridTemplateColumns,
  isSelected,
  logisticStatus,
  onToggleSelected,
}: ProductTableRowViewProps) {
  return (
    <FlashOnUpdate caseKey="contextOverhead">
      <div
        role="row"
        className={cn(
          "grid items-center border-b border-border px-4 py-2.5 text-sm",
          isSelected && "bg-accent-dim",
        )}
        style={{ gridTemplateColumns }}
      >
        <span role="cell">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelected}
            aria-label={`Select ${product.title}`}
          />
        </span>
        <span role="cell">
          <Image
            src={product.thumbnail}
            alt={product.title}
            width={42}
            height={42}
            sizes="42px"
            className="size-10.5 rounded bg-white object-cover"
          />
        </span>
        <span role="cell" className="min-w-0 pr-3">
          <p className="truncate font-medium text-foreground">
            {product.title}
          </p>
          <p className="mt-0.75 truncate font-mono text-[13px] text-text-3">
            {product.sku}
          </p>
        </span>
        <span role="cell" className="truncate text-text-2">
          {product.category}
        </span>
        <span role="cell" className="font-medium text-foreground tabular-nums">
          {formatCurrency(product.price)}
        </span>
        <span
          role="cell"
          className={cn(
            "tabular-nums",
            product.stock === 0 ? "text-alert" : "text-foreground",
          )}
        >
          {product.stock}
        </span>
        <span role="cell">
          <Badge tone={getStatusTone(logisticStatus)} dot>
            {logisticStatus}
          </Badge>
        </span>
      </div>
    </FlashOnUpdate>
  );
}
