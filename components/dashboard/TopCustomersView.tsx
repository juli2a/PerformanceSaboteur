import type { CustomerData } from "@/types/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { deriveHue } from "@/lib/utils/derive";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";

interface Props {
  customers: CustomerData[];
}

// Presentational, takes already-fetched data as a prop. TopCustomers (the async fetch wrapper below it in the good path) and WaterfallSections (app/(shell)/dashboard/page.tsx, Case 5 bad path) both render this same component; only how the data reaches it differs.
export function TopCustomersView({ customers }: Props) {
  return (
    <Card variant="global" className="@min-[1024px]:flex-1">
      <h2 className="heading-2 mb-heading-gap">Top Customers</h2>
      <ul>
        {customers.map((c, i) => {
          const hue = deriveHue(c.id);
          const initials = c.name
            .split(" ")
            .map((part) => part[0])
            .join("");

          return (
            <li
              key={c.id}
              className={cn(
                "flex items-center gap-3 py-2.5 @max-[340px]:flex-wrap @min-[1024px]:gap-3.5 @min-[1024px]:py-3",
                i < customers.length - 1 && "border-b border-border",
              )}
            >
              <span
                className="flex size-8.5 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white @min-[1024px]:size-9.5 @min-[1024px]:text-[13px]"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue} 60% 55%), hsl(${hue + 30} 60% 45%))`,
                }}
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground text-sm min-[360px]:text-base lg:text-lg">
                  {c.name}
                </p>
                <p className="truncate text-sm text-text-3">{c.company}</p>
              </div>
              <div className="text-right @max-[340px]:mt-1 @max-[340px]:w-full @max-[340px]:text-left">
                <p className="tabular-nums font-semibold text-foreground text-sm md:text-base">
                  {formatCurrency(c.ltv)}
                </p>
                <p className="text-sm text-text-3">{c.orders} orders</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
