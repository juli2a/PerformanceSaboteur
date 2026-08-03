"use client";

import { useContext, useOptimistic, useState, useTransition } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";

import { LOGISTIC_STATUSES, type LogisticStatus } from "@/types/inventory";
import { useInventorySelectionStore } from "@/store/inventory-selection";
import { useInventoryStatusStore } from "@/store/inventory-status";
import { TableSelectionContext } from "@/context/TableSelectionContext";
import { useSimulatorCase } from "@/hooks/useSimulatorCase";
import { updateLogisticStatus } from "@/lib/server/inventory-actions";
import { getStatusDotClass, getStatusTone } from "@/lib/utils/inventory";
import { cn } from "@/lib/utils/cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function StatusDotLabel({ status }: { status: LogisticStatus }) {
  return (
    <span className="flex items-center gap-2.25">
      <span
        className={cn(
          "size-1.75 shrink-0 rounded-full",
          getStatusDotClass(status),
        )}
      />
      {status}
    </span>
  );
}

// Toolbar's "Bulk Actions" panel, a Select + a button, not a list of menu actions, so it's a Popover rather than a DropdownMenu (Menu semantics expect menuitem children, and nesting a Select's own listbox inside one fights it for keyboard focus). base-ui's `alignItemWithTrigger` defaults to on, mimicking native <select> by overlapping the trigger so the selected item lines up with it; disabled in components/ui/select.tsx so it behaves like the rest of this app's dropdowns.
//
// Pick a status, confirm in a modal, then PATCH every selected product. DummyJSON doesn't persist writes, so the new status is also applied via inventory-status's optimistic overlay, otherwise the table would have no way to show the result of the demo.
//
// Case 7 (Context Overhead): reads/writes whichever selection source is currently active (Zustand or the isolated Context, see context/TableSelectionContext.tsx), same reasoning as SelectAllCheckbox.
export default function BulkActions() {
  const isContextOverheadOn = useSimulatorCase("contextOverhead");
  const zustandSelected = useInventorySelectionStore((state) => state.selected);
  const zustandClear = useInventorySelectionStore((state) => state.clear);
  const context = useContext(TableSelectionContext)!;

  const selected = isContextOverheadOn ? context.selected : zustandSelected;
  const clearSelection = isContextOverheadOn ? context.clear : zustandClear;
  const setStatuses = useInventoryStatusStore((state) => state.setStatuses);

  const [panelOpen, setPanelOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [status, setStatus] = useState<LogisticStatus>(LOGISTIC_STATUSES[0]);
  const [isPending, startTransition] = useTransition();

  const hasSelection = selected.size > 0;
  const selectedProducts = [...selected.values()];
  const [optimisticProducts, setOptimisticStatus] = useOptimistic(
    selectedProducts,
    (products, nextStatus: LogisticStatus) =>
      products.map((product) => ({ ...product, logisticStatus: nextStatus })),
  );
  const noopChange =
    selectedProducts.length > 0 &&
    selectedProducts.every((product) => product.logisticStatus === status);

  const handleConfirm = () => {
    startTransition(async () => {
      setOptimisticStatus(status);
      const ids = [...selected.keys()];
      try {
        await updateLogisticStatus(ids, status);
      } catch (error) {
        console.error("Bulk status update failed:", error);
        return;
      }
      setStatuses(ids, status);
      clearSelection();
      setConfirmOpen(false);
    });
  };

  return (
    <>
      <div className="ml-auto hidden items-center gap-2.5 lg:flex">
        {hasSelection && (
          <Chip onRemove={clearSelection} removeLabel="Clear selection">
            {selected.size} selected
          </Chip>
        )}
        <Popover open={panelOpen} onOpenChange={setPanelOpen}>
          <PopoverTrigger
            disabled={!hasSelection}
            className={cn(buttonVariants(), "group")}
          >
            Bulk Actions
            <ChevronDown className="size-3.5 transition-transform group-data-popup-open:rotate-180" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-66 rounded bg-raise p-4">
            <p className="mb-2.5 text-[13px] font-semibold text-text-2">
              Change Status:
            </p>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as LogisticStatus)}
            >
              <SelectTrigger className="h-11 bg-surface-2 text-[13px] font-medium text-foreground">
                <SelectValue>
                  {(value: LogisticStatus) => <StatusDotLabel status={value} />}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-(--anchor-width) text-[13px]">
                {LOGISTIC_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="py-2.25">
                    <StatusDotLabel status={s} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="mt-3 w-full"
              disabled={!hasSelection}
              onClick={() => {
                setPanelOpen(false);
                setConfirmOpen(true);
              }}
            >
              Ok
            </Button>
            {!hasSelection && (
              <p className="mt-2.25 text-center text-[12px] text-text-3">
                Select products first
              </p>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-140">
          <DialogHeader icon={<RefreshCw className="size-5" />}>
            <DialogTitle>Confirm status change</DialogTitle>
          </DialogHeader>

          <DialogDescription>
            Are you sure you want to set the following status for these
            products?
          </DialogDescription>

          <div className="my-3.5 flex justify-center">
            <Badge tone={getStatusTone(status)} dot>
              {status}
            </Badge>
          </div>

          <div className="mb-6 max-h-60 overflow-y-auto rounded-xs border border-border bg-surface-2 p-1.5">
            {optimisticProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3.5 border-b border-border px-2.75 py-2.5 last:border-b-0"
              >
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                  {product.title}
                </span>
                <Badge
                  tone={getStatusTone(product.logisticStatus)}
                  size="sm"
                  dot
                >
                  {product.logisticStatus}
                </Badge>
                <span className="shrink-0 font-mono text-[12px] text-text-3">
                  {product.sku}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="px-6.5"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="px-7.5"
              disabled={isPending || noopChange}
              onClick={handleConfirm}
            >
              Ok
            </Button>
          </div>
          {noopChange && (
            <p className="mt-2.5 text-center text-[12px] text-text-3">
              Selected products already have this status.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
