import { getCategories } from "@/lib/server/dal/dashboard";
import { CategoryAnalyticsView } from "./CategoryAnalyticsView";

export default async function CategoryAnalytics() {
  const categories = await getCategories();
  return <CategoryAnalyticsView categories={categories} />;
}
