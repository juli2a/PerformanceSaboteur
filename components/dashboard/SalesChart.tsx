import { getCarts } from "@/lib/server/dal/dashboard";
import { SalesChartClient } from "./SalesChartClient";

export default async function SalesChart() {
  const { salesChart } = await getCarts();
  return <SalesChartClient data={salesChart} />;
}
