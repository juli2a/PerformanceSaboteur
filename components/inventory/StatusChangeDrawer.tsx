"use client";

import { useState } from "react";
import { useSimPerformanceStore } from "@/store/simulator-performance";
import Image from "next/image";
import { Check, RefreshCw, X } from "lucide-react";

import {
  LOGISTIC_STATUSES,
  type AmplifiedProduct,
  type LogisticStatus,
} from "@/types/inventory";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { getStatusDotClass, getStatusRowClass } from "@/lib/utils/inventory";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { updateLogisticStatus } from "@/lib/server/inventory-actions";

interface StatusChangeDrawerProps {
  product: AmplifiedProduct;
  currentStatus: LogisticStatus;
  onChangeStatus: (ids: number[], status: LogisticStatus) => void;
}

// Mobile per-product status-change drawer, triggered from ProductCard's "Change" button. Same PATCH + optimistic-overlay pattern as Bulk Actions, just scoped to a single product. Where the optimistic status gets applied locally is injected via onChangeStatus; Case 7's mobile bad/good split lives entirely in that callback, not here (see ProductCard vs ProductCardUnoptimized).
export default function StatusChangeDrawer({
  product,
  currentStatus,
  onChangeStatus,
}: StatusChangeDrawerProps) {
  const panelHeight = useSimPerformanceStore(
    (state) => state.mobilePanelHeight,
  );

  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<LogisticStatus | null>(null);
  const [pending, setPending] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setPick(null);
  };

  const handleChange = async () => {
    if (!pick) return;
    setPending(true);
    await updateLogisticStatus([product.id], pick);
    onChangeStatus([product.id], pick);
    setPending(false);
    handleOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger
        render={
          <Button variant="secondary" size="sm" aria-label="Change status" />
        }
      >
        <RefreshCw className="size-3.75" />
        Change
      </DrawerTrigger>
      <DrawerContent bottomOffset={panelHeight}>
        <DrawerHeader>
          <DrawerTitle>Change status</DrawerTitle>
          <DrawerClose aria-label="Close" className="text-text-2">
            <X className="size-5" />
          </DrawerClose>
        </DrawerHeader>
        <DrawerBody className="flex flex-col px-3.5 pt-3 pb-5.5">
          <div className="mb-4.5 flex items-center gap-3.25 rounded-xs border border-border bg-surface-2 p-3.25">
            <Image
              src={product.thumbnail}
              alt={product.title}
              width={50}
              height={50}
              sizes="50px"
              className="size-12.5 shrink-0 rounded bg-white object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-foreground">
                {product.title}
              </p>
              <p className="mt-0.75 truncate font-mono text-sm text-text-3">
                {product.sku}
              </p>
              <p className="mt-1.25 text-sm text-text-2">
                {product.category} ·{" "}
                <span
                  className={cn(
                    "font-semibold",
                    product.stock === 0 ? "text-alert" : "text-foreground",
                  )}
                >
                  {product.stock}
                </span>{" "}
                in stock
              </p>
            </div>
            <span className="self-start text-sm font-semibold text-foreground tabular-nums">
              {formatCurrency(product.price)}
            </span>
          </div>

          <p className="mb-2.75 text-[13px] font-semibold text-text-2">
            Select a new status
          </p>
          <div className="flex flex-col gap-2.25">
            {LOGISTIC_STATUSES.map((s) => {
              const isCurrent = s === currentStatus;
              const isPicked = pick === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setPick(s)}
                  className={cn(
                    "flex w-full items-center gap-2.75 rounded-xs border px-3.75 py-3.25 text-left text-sm font-semibold transition-colors",
                    getStatusRowClass(s),
                    isPicked ? "border-current" : "border-transparent",
                    isCurrent && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "size-2.25 shrink-0 rounded-full",
                      getStatusDotClass(s),
                    )}
                  />
                  <span className="flex-1">{s}</span>
                  {isCurrent && (
                    <span className="text-xs font-semibold text-text-3">
                      Current
                    </span>
                  )}
                  {isPicked && <Check className="size-4" />}
                </button>
              );
            })}
          </div>
        </DrawerBody>
        <DrawerFooter className="grid grid-cols-2 gap-2.5">
          <DrawerClose render={<Button variant="outline" className="w-full" />}>
            Cancel
          </DrawerClose>
          <Button
            className="w-full"
            disabled={!pick || pending}
            onClick={handleChange}
          >
            Change
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
