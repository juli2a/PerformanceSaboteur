"use client";

import { useContext, useEffect, useMemo, useRef } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnFiltersState,
  type FilterFn,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { AmplifiedProduct } from "@/types/inventory";
import { cn } from "@/lib/utils/cn";
import { MediaContext } from "@/context/MediaContext";
import { useInventoryFiltersStore } from "@/store/inventory-filters";
import { useInventorySearchStore } from "@/store/inventory-search";
import { useInventorySelectionStore } from "@/store/inventory-selection";
import { useSimulatorCase } from "@/hooks/useSimulatorCase";
import ProductCard from "@/components/inventory/ProductCard";
import ProductCardUnoptimized from "@/components/inventory/ProductCardUnoptimized";
import ProductTableRow from "@/components/inventory/ProductTableRow";
import ProductTableRowUnoptimized from "@/components/inventory/ProductTableRowUnoptimized";
import SelectAllCheckbox from "@/components/inventory/SelectAllCheckbox";

const columnHelper = createColumnHelper<AmplifiedProduct>();

// Exact membership check: built-in filterFns either expect the row value to be an array (arrIncludes) or do substring matching (includesString), neither of which is right for "is this scalar category in the selected set".
const categoryFilterFn: FilterFn<AmplifiedProduct> = (
  row,
  columnId,
  filterValue: Set<string>,
) => filterValue.has(row.getValue(columnId));

// Column order mirrors the visual columns; `size` is the single source of truth for desktop column width, read by gridTemplateColumns below instead of a hand-maintained CSS string, so columns and layout can't drift apart. Unused on the mobile card layout.
const columns = [
  columnHelper.display({ id: "select", size: 44 }),
  columnHelper.display({ id: "thumbnail", size: 60 }),
  columnHelper.accessor("title", { id: "name", size: 320 }),
  columnHelper.accessor("category", {
    id: "category",
    size: 140,
    filterFn: categoryFilterFn,
  }),
  columnHelper.accessor("price", { id: "price", size: 120 }),
  columnHelper.accessor("stock", { id: "stock", size: 80 }),
  columnHelper.accessor("logisticStatus", { id: "status", size: 110 }),
];

// The only column that should flex with available width instead of using
// its own `size` literally.
const FLEX_COLUMN_ID = "name";

const ROW_HEIGHT_PX = 58;
const CARD_HEIGHT_PX = 122;

// Cases that disable virtualization render this many rows as a flat DOM list. Case 7 (contextOverhead): exposes unnecessary re-renders across the full visible set. Case 3 (heavyMounting) deliberately does NOT use this cap, mounting every row at once is the entire point of that case, see flatRowLimit below.
export const FLAT_ROW_LIMIT = 200;

interface ProductTableProps {
  products: AmplifiedProduct[];
}

// One virtualizer + one scroll container shared by both layouts: switching the rendered item template on a breakpoint change (e.g. tablet rotation) keeps the same scroll offset, instead of two independent containers each tracking their own (and one silently losing its position while hidden).
export default function ProductTable({ products }: ProductTableProps) {
  const isMobile = useContext(MediaContext);
  const isContextOverheadOn = useSimulatorCase("contextOverhead");
  const isHeavyMountingOn = useSimulatorCase("heavyMounting");

  // skipVirtualization is shared by multiple cases, each one adds its own toggle here so ProductTable doesn't need a new prop per case. contextOverhead forces the flat FLAT_ROW_LIMIT list regardless of Case 3's own state, with virtualization on, only a handful of rows are ever mounted, and the mass-rerender contrast this case demonstrates wouldn't be visible (see docs/case7.md). heavyMounting (Case 3) skips virtualization too, but unlike contextOverhead, with no row cap at all (see flatRowLimit below): mounting literally every row, unwindowed, is the anti-pattern this case demonstrates.
  const skipVirtualization = isContextOverheadOn || isHeavyMountingOn;

  // Selection is deliberately isolated between the good (Zustand) and bad (Context, see TableSelectionProvider, mounted in the Inventory page above both Toolbar and this component) paths; clearing on every toggle flip means neither carries stale selections into the other. The Context side clears itself the same way, internally.
  const clearSelection = useInventorySelectionStore((state) => state.clear);
  useEffect(() => {
    clearSelection();
  }, [isContextOverheadOn, clearSelection]);

  const selectedCategories = useInventoryFiltersStore(
    (state) => state.categories,
  );
  const matchedIds = useInventorySearchStore((state) => state.matchedIds);

  // Search matches only base DummyJSON ids (1-100, see Toolbar/Case 4); every batch duplicate beyond the first keeps an id above that range, so this naturally surfaces just the one canonical row per match instead of every near-identical "(Batch N)" duplicate (see AMPLIFICATION_BATCHES in lib/server/dal/inventory.ts). Pre-filtered here (not via columnFilters) since it narrows the underlying dataset rather than a displayed column's value.
  const searchedProducts = useMemo(
    () =>
      matchedIds === null
        ? products
        : products.filter((product) => matchedIds.has(product.id)),
    [products, matchedIds],
  );

  // Memoized so the reference is stable across renders when the selection hasn't changed: react-table's controlled `state.columnFilters` treats a new reference as a real change and recomputes the filtered row model every render, which (this component has no compiler memoization) causes a render storm without it.
  const columnFilters: ColumnFiltersState = useMemo(
    () =>
      selectedCategories.size > 0
        ? [{ id: "category", value: selectedCategories }]
        : [],
    [selectedCategories],
  );

  const table = useReactTable({
    data: searchedProducts,
    columns,
    state: { columnFilters },
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;
  const visibleProducts = rows.map((row) => ({
    id: row.original.id,
    title: row.original.title,
    sku: row.original.sku,
    logisticStatus: row.original.logisticStatus,
  }));

  const gridTemplateColumns = table
    .getAllColumns()
    .map((column) =>
      column.id === FLEX_COLUMN_ID ? "minmax(0,1fr)" : `${column.getSize()}px`,
    )
    .join(" ");

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (isMobile ? CARD_HEIGHT_PX : ROW_HEIGHT_PX),
    overscan: isMobile ? 6 : 10,
    // Without this, getVirtualItems() returns no rows until ResizeObserver measures the real viewport, leaving the rowgroup empty when accessibility audits like PageSpeed scan it.
    initialRect: { width: 0, height: 600 },
  });

  if (isMobile === undefined) return null;

  // heavyMounting (Case 3) removes the cap entirely, every one of the 2000+ rows mounts at once, unwindowed, instead of just the first FLAT_ROW_LIMIT of them.
  const flatRowLimit = isHeavyMountingOn ? rows.length : FLAT_ROW_LIMIT;

  const flatRows = (
    <div role={isMobile ? undefined : "rowgroup"}>
      {rows.slice(0, flatRowLimit).map((row) => {
        const product = row.original;
        if (isMobile) {
          // Case 7's mobile bad/good branch point, mirrors the desktop branch right below (ProductTableRowUnoptimized vs ProductTableRow).
          const ProductCardComponent = isContextOverheadOn
            ? ProductCardUnoptimized
            : ProductCard;
          return (
            <div key={product.id} role="listitem" className="pb-2">
              <ProductCardComponent product={product} />
            </div>
          );
        }
        // Case 7's desktop bad/good branch point, everything else about the two row components is identical.
        const Row = isContextOverheadOn
          ? ProductTableRowUnoptimized
          : ProductTableRow;
        return (
          <Row
            key={product.id}
            product={product}
            gridTemplateColumns={gridTemplateColumns}
          />
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border-t">
      <div
        ref={scrollRef}
        role={isMobile ? "list" : "table"}
        aria-label="Product inventory"
        className={cn(
          "flex-1 overflow-auto",
          isMobile ? "p-3" : "card-surface-bg",
        )}
      >
        {!isMobile && (
          <div
            role="row"
            className="sticky top-0 z-10 grid border-border bg-surface-2 px-4 py-3.75 text-left text-xs font-semibold tracking-wide text-text-3 uppercase"
            style={{ gridTemplateColumns }}
          >
            <span role="columnheader">
              <SelectAllCheckbox visibleProducts={visibleProducts} />
            </span>
            <span role="columnheader" />
            <span role="columnheader">Name / SKU</span>
            <span role="columnheader">Category</span>
            <span role="columnheader">Price</span>
            <span role="columnheader">Stock</span>
            <span role="columnheader">Status</span>
          </div>
        )}
        {skipVirtualization ? (
          flatRows
        ) : (
          <div
            role={isMobile ? undefined : "rowgroup"}
            className="relative"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const product = rows[virtualItem.index].original;
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  role={isMobile ? "listitem" : undefined}
                  className={cn(
                    "absolute top-0 left-0 w-full",
                    isMobile && "pb-2",
                  )}
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  {isMobile ? (
                    <ProductCard product={product} />
                  ) : (
                    <ProductTableRow
                      product={product}
                      gridTemplateColumns={gridTemplateColumns}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
