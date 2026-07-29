import { cookies } from "next/headers";
import UpdatedAt from "@/components/dashboard/UpdatedAt";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardContentUnoptimized } from "@/components/dashboard/DashboardContentUnoptimized";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const isWaterfallOn = cookieStore.get("waterfall")?.value === "on";
  const isHydrationMismatchOn =
    cookieStore.get("hydrationMismatch")?.value === "on";

  return (
    <div className="space-y-4.5 px-4 py-4.5 @min-[1024px]:space-y-5.5 @min-[1024px]:p-7.5">
      <div className="flex items-center justify-between @max-[340px]:flex-col @max-[340px]:items-start @max-[340px]:gap-1">
        <div>
          <h1 className="heading-1">Dashboard</h1>
          <p className="mt-heading-subtitle-gap hidden text-sm text-text-2 @min-[1024px]:block">
            Merchant analytics overview · last 30 days
          </p>
        </div>
        <span className="whitespace-nowrap text-sm text-text-2">
          Updated <UpdatedAt isHydrationMismatchOn={isHydrationMismatchOn} />
        </span>
      </div>

      {isWaterfallOn ? <DashboardContentUnoptimized /> : <DashboardContent />}
    </div>
  );
}
