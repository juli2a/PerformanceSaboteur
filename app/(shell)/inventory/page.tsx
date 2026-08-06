import Toolbar from "@/components/inventory/Toolbar";
import ProductTable from "@/components/inventory/ProductTable";
import { TableSelectionProvider } from "@/context/TableSelectionContext";
import { RowStatusProvider } from "@/context/RowStatusContext";
import {
  getAmplifiedProducts,
  getInventoryCategories,
} from "@/lib/server/dal/inventory";

// Server Component — fetches 100 products, amplifies to 2000+ rows server-side
export default async function InventoryPage() {
  const [products, categories] = await Promise.all([
    getAmplifiedProducts(),
    getInventoryCategories(),
  ]);

  return (
    // Mobile: self-contained height (viewport minus the 60px mobile header,
    // see Header.tsx's h-[60px]) instead of inheriting h-full from `main` —
    // `main` no longer has a definite height on mobile (the shell now lets
    // the real document scroll, see app/(shell)/layout.tsx), so a % height
    // here would resolve to auto and collapse ProductTable's virtualized
    // scroll container. Desktop keeps the original h-full chain unchanged.
    <div className="flex h-[calc(100dvh-60px)] flex-col px-4 py-4.5 lg:h-full @min-[1024px]:p-7.5">
      <div className="pb-5">
        <h1 className="heading-1">Inventory Control</h1>
        <p className="mt-heading-subtitle-gap hidden text-sm text-text-2 @min-[1024px]:block">
          2,000 SKUs
        </p>
      </div>
      {/* Fixed minimum width for the toolbar+table block, scrolling
          horizontally past it, rather than reflowing columns — the
          desktop table's row↔card switch stays tied to real screen width
          (MediaContext), not to how narrow `main` gets when the guide
          panel opens. */}
      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="flex h-full lg:min-w-190 flex-col">
          {/* Case 7 (Context Overhead): two isolated Contexts, one per demoed
              interaction — TableSelectionProvider for desktop's checkbox
              selection (shared by Toolbar's Bulk Actions/Select All and
              ProductTable's rows, so whichever selection source is active
              stays consistent across both), RowStatusProvider for mobile's
              single-product status change (read by ProductTable's cards).
              Neither Zustand store either one shadows is touched by this
              case. */}
          <TableSelectionProvider>
            <RowStatusProvider>
              <Toolbar categories={categories} />
              <ProductTable products={products} />
            </RowStatusProvider>
          </TableSelectionProvider>
        </div>
      </div>
    </div>
  );
}
