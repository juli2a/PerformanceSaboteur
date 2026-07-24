import type { CategoryData } from "@/types/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";

interface Props {
  categories: CategoryData[];
}

// Presentational, takes already-fetched data as a prop. CategoryAnalytics (the async fetch wrapper below it in the good path) and WaterfallSections (app/(shell)/dashboard/page.tsx, Case 5 bad path) both render this same component; only how the data reaches it differs.
export function CategoryAnalyticsView({ categories }: Props) {
  return (
    // data-section marks this side only: this and TopCustomersView share one Suspense boundary (DashboardContent.tsx), so they can only ever become visible together; a marker on both would just be two identical timestamps for the e2e waterfall test (case5-waterfall.spec.ts).
    <Card
      variant="global"
      className="@min-[1024px]:flex-[0_0_38%]"
      data-section="analytics-pair"
    >
      <h2 className="heading-2 mb-heading-gap">Categories</h2>
      <ul className="flex flex-col gap-3.75">
        {categories.map((cat) => (
          <li key={cat.slug} className="flex flex-col gap-1.75">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{cat.name}</span>
              <span className="text-text-2 @min-[1024px]:text-lg">
                <span className="hidden @min-[1024px]:inline text-base">
                  {formatCurrency(cat.stockValue)} ·{" "}
                </span>
                {cat.share}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-xs bg-surface-2">
              <div
                className="h-full rounded-xs bg-linear-to-r from-accent to-accent-2"
                style={{ width: `${Math.min(cat.share * 3, 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
