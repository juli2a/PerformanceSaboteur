"use client";

import { Filter, ChevronDown, X } from "lucide-react";

import { useContext } from "react";
import { MediaContext } from "@/context/MediaContext";
import { useSimPerformanceStore } from "@/store/simulator-performance";
import { useInventoryFiltersStore } from "@/store/inventory-filters";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import CategoryFilterList from "@/components/inventory/CategoryFilterList";

interface CategoryFilterProps {
  categories: string[];
}

// Desktop: dropdown with a "Filter by Category" trigger.
// Mobile: same multi-select list, collapsed into a funnel-icon bottom sheet.
// Both branches render the same CategoryFilterList, see that file for why.
export default function CategoryFilter({ categories }: CategoryFilterProps) {
  const isMobile = useContext(MediaContext);
  const panelHeight = useSimPerformanceStore(
    (state) => state.mobilePanelHeight,
  );
  const selectedCategories = useInventoryFiltersStore(
    (state) => state.categories,
  );
  const clearCategories = useInventoryFiltersStore(
    (state) => state.clearCategories,
  );
  const hasSelection = selectedCategories.size > 0;

  if (isMobile === undefined) return null;

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger
          aria-label="Filter by category"
          className={cn(
            "relative grid size-11 shrink-0 place-items-center rounded border",
            hasSelection
              ? "border-primary bg-accent-dim text-primary"
              : "border-border bg-surface text-text-2",
          )}
        >
          <Filter className="size-4.5" />
          {hasSelection && (
            <span className="absolute top-2 right-2 size-1.75 rounded-full bg-primary shadow-[0_0_6px_var(--color-primary)]" />
          )}
        </DrawerTrigger>
        <DrawerContent bottomOffset={panelHeight}>
          <DrawerHeader>
            <DrawerTitle>Filter by Category</DrawerTitle>
            <DrawerClose aria-label="Close" className="text-text-2">
              <X className="size-5" />
            </DrawerClose>
          </DrawerHeader>
          <DrawerBody className="flex flex-col px-3.5 pt-2.5 pb-5.5">
            <CategoryFilterList categories={categories} isMobile />
          </DrawerBody>
          <DrawerFooter className="grid grid-cols-2 items-center gap-2.5">
            <div className="flex justify-center">
              {hasSelection && (
                <Button variant="ghost" size="sm" onClick={clearCategories}>
                  Clear all
                </Button>
              )}
            </div>
            <DrawerClose render={<Button className="w-full">OK</Button>} />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex h-11 items-center gap-2.25 rounded border px-3.75 text-sm font-medium whitespace-nowrap transition-colors",
          hasSelection
            ? "border-primary bg-accent-dim text-foreground"
            : "border-border bg-surface text-text-2",
        )}
      >
        <Filter
          className={cn(
            "size-3.75",
            hasSelection ? "text-primary" : "text-text-3",
          )}
        />
        Filter by Category
        <span
          className={cn(
            "grid size-4.5 place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground",
            !hasSelection && "invisible",
          )}
        >
          {selectedCategories.size}
        </span>
        <ChevronDown className="size-3.5 text-text-3 transition-transform group-data-popup-open:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-90 w-55 overflow-y-auto rounded bg-raise p-1.5"
      >
        <CategoryFilterList categories={categories} />
        {hasSelection && (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCategories}
              className="w-full"
            >
              Clear all
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
