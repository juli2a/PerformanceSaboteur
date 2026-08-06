import { Suspense } from "react";
import TopProductsBanner from "@/components/dashboard/TopProductsBanner";
import KpiGrid from "@/components/dashboard/KpiGrid";
import SalesChart from "@/components/dashboard/SalesChart";
import CategoryAnalytics from "@/components/dashboard/CategoryAnalytics";
import TopCustomers from "@/components/dashboard/TopCustomers";
import MicroCardsGrid from "@/components/dashboard/MicroCardsGrid";
import {
  BannerSkeleton,
  KpiSkeleton,
  ChartSkeleton,
  AnalyticsPairSkeleton,
  MicroCardsSkeleton,
} from "@/components/dashboard/skeletons";

// Good path (toggle off): every section streams independently in its own Suspense boundary, see lib/server/dal/dashboard.ts for how React.cache dedupes getCarts() between KpiGrid and SalesChart so they resolve together without a double fetch.
export function DashboardContent() {
  return (
    <>
      <Suspense fallback={<BannerSkeleton />}>
        <TopProductsBanner />
      </Suspense>

      <Suspense fallback={<KpiSkeleton />}>
        <KpiGrid />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <SalesChart />
      </Suspense>

      <Suspense fallback={<AnalyticsPairSkeleton />}>
        <div className="flex flex-col gap-4 @min-[1024px]:flex-row">
          <CategoryAnalytics />
          <TopCustomers />
        </div>
      </Suspense>

      <Suspense fallback={<MicroCardsSkeleton />}>
        <MicroCardsGrid />
      </Suspense>
    </>
  );
}
