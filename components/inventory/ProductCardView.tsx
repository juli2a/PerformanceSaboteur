import Image from "next/image";

import type { AmplifiedProduct, LogisticStatus } from "@/types/inventory";
import { Badge } from "@/components/ui/badge";
import { getStatusTone } from "@/lib/utils/inventory";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import FlashOnUpdate from "@/components/simulator/FlashOnUpdate";
import StatusChangeDrawer from "@/components/inventory/StatusChangeDrawer";

interface ProductCardViewProps {
  product: AmplifiedProduct;
  logisticStatus: LogisticStatus;
  onChangeStatus: (ids: number[], status: LogisticStatus) => void;
}

// Shared markup for ProductCard (good path, Zustand selector) and ProductCardUnoptimized (Case 7 mobile bad path, Context), identical in both, since the only thing that case demonstrates is *how* logisticStatus / onChangeStatus are sourced upstream, not how the card looks. Keeping that one difference in the two callers and the shared rendering (plus the single FlashOnUpdate wrap) here avoids maintaining two copies of markup that must stay in lockstep; mirrors ProductTableRowView's split.
export default function ProductCardView({
  product,
  logisticStatus,
  onChangeStatus,
}: ProductCardViewProps) {
  return (
    <FlashOnUpdate caseKey="contextOverhead">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex gap-3">
          <Image
            src={product.thumbnail}
            alt={product.title}
            width={54}
            height={54}
            sizes="54px"
            className="size-13.5 shrink-0 rounded bg-white object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-foreground">
              {product.title}
            </p>
            <p className="mt-1 font-mono text-sm text-text-3">{product.sku}</p>
          </div>
          <span className="self-start font-semibold text-foreground tabular-nums">
            {formatCurrency(product.price)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.75">
          <span className="rounded-xs border border-border bg-surface-2 px-2 py-0.5 text-sm font-semibold text-text-2">
            {product.category}
          </span>
          <span className="text-sm text-text-2">
            <span
              className={cn(
                "font-semibold tabular-nums",
                product.stock === 0 ? "text-alert" : "text-foreground",
              )}
            >
              {product.stock}
            </span>{" "}
            in stock
          </span>
        </div>
        <div className="flex items-center gap-2.5 border-t border-border pt-3">
          <Badge tone={getStatusTone(logisticStatus)} dot>
            {logisticStatus}
          </Badge>
          <div className="flex-1" />
          <StatusChangeDrawer
            product={product}
            currentStatus={logisticStatus}
            onChangeStatus={onChangeStatus}
          />
        </div>
      </div>
    </FlashOnUpdate>
  );
}
