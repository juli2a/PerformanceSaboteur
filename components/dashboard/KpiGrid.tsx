import { getCarts } from "@/lib/server/dal/dashboard";
import { KpiGridView } from "./KpiGridView";

export default async function KpiGrid() {
  const { kpi } = await getCarts();
  return <KpiGridView kpi={kpi} />;
}
