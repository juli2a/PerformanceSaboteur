import { getProducts } from "@/lib/server/dal/dashboard";
import { MicroCardsGridClient } from "./MicroCardsGridClient";

export default async function MicroCardsGrid() {
  const products = await getProducts();
  return <MicroCardsGridClient products={products} />;
}
