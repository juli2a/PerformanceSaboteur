"use client";

import { useInventoryFiltersStore } from "@/store/inventory-filters";
import { formatCategoryLabel } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Checkbox } from "@/components/ui/checkbox";

interface CategoryFilterListProps {
  categories: string[];
  isMobile?: boolean;
}

// Shared row markup for the category multi-select, rendered inside both the desktop DropdownMenuContent and the mobile Sheet body by CategoryFilter, so a tablet crossing the breakpoint never shows two divergent lists. Plain Checkbox + label rows (not DropdownMenuCheckboxItem) since the Sheet has no Menu context to host menu items in. `isMobile` only adjusts row height/font size, the markup and behavior stay identical.
export default function CategoryFilterList({
  categories,
  isMobile = false,
}: CategoryFilterListProps) {
  const selectedCategories = useInventoryFiltersStore(
    (state) => state.categories,
  );
  const toggleCategory = useInventoryFiltersStore(
    (state) => state.toggleCategory,
  );

  return (
    <div className="flex flex-col gap-1">
      {categories.map((category) => {
        const inputId = `category-filter-${category}`;
        const isSelected = selectedCategories.has(category);
        return (
          <label
            key={category}
            htmlFor={inputId}
            className={cn(
              "flex items-center gap-2.75 rounded px-2.75",
              isMobile ? "h-11.5" : "py-2.25 text-sm",
              isSelected
                ? "bg-accent-dim font-semibold text-foreground"
                : "font-medium text-text-2 hover:bg-white/5",
            )}
          >
            <Checkbox
              id={inputId}
              checked={isSelected}
              onCheckedChange={() => toggleCategory(category)}
            />
            {formatCategoryLabel(category)}
          </label>
        );
      })}
    </div>
  );
}
