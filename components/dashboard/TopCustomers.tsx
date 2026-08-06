import { getUsers } from "@/lib/server/dal/dashboard";
import { TopCustomersView } from "./TopCustomersView";

export default async function TopCustomers() {
  const customers = await getUsers();
  return <TopCustomersView customers={customers} />;
}
