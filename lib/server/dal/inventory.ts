import { cache } from "react";
import { apiFetch } from "@/lib/server/fetcher";
import type { AmplifiedProduct, LogisticStatus } from "@/types/inventory";

// DummyJSON's product catalog uses exactly these 6 shipping phrases, safe to map exhaustively without a fallback case.
type ShippingInformation =
  | "Ships overnight"
  | "Ships in 1-2 business days"
  | "Ships in 3-5 business days"
  | "Ships in 1 week"
  | "Ships in 2 weeks"
  | "Ships in 1 month";

interface DummyProduct {
  id: number;
  title: string;
  category: string;
  price: number;
  stock: number;
  thumbnail: string;
  images: string[];
  discountPercentage: number;
  rating: number;
  brand?: string;
  sku: string;
  shippingInformation: ShippingInformation;
}

const AMPLIFICATION_BATCHES = 20;
const BASE_PRODUCT_COUNT = 100;
const LOW_STOCK_THRESHOLD = 10;

// Shipping speed only determines status for healthy stock levels; low or zero stock overrides it below.
const STATUS_BY_SHIPPING_SPEED: Record<ShippingInformation, LogisticStatus> = {
  "Ships overnight": "In Stock",
  "Ships in 1-2 business days": "In Stock",
  "Ships in 3-5 business days": "In Stock",
  "Ships in 1 week": "In Transit",
  "Ships in 2 weeks": "Ordered",
  "Ships in 1 month": "To Order",
};

export function deriveLogisticStatus(
  stock: number,
  shippingInformation: ShippingInformation,
): LogisticStatus {
  if (stock <= 3) return "Out of Stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "To Order";
  return STATUS_BY_SHIPPING_SPEED[shippingInformation] ?? "In Stock";
}

// Inverse of `product.id + batch * BASE_PRODUCT_COUNT`; recovers the real DummyJSON id (1..100) so bulk updates can target an existing resource. Exported for lib/server/actions/inventory.ts.
export function deriveRealProductId(amplifiedId: number): number {
  return ((amplifiedId - 1) % BASE_PRODUCT_COUNT) + 1;
}

// Fetches 100 products from DummyJSON and replicates them ×20 → 2000+ rows. logisticStatus is derived from stock + shippingInformation (see deriveLogisticStatus above); sku is DummyJSON's real per-product field, just carried through unmodified. The original 100 keep their plain title; only replicated batches (2+) get the "(Batch N)" suffix so they read as visible copies.
export const getAmplifiedProducts = cache(
  async (): Promise<AmplifiedProduct[]> => {
    const { products } = await apiFetch<{ products: DummyProduct[] }>(
      `/products?limit=${BASE_PRODUCT_COUNT}`,
    );

    // Destructure only the fields the UI needs exactly once, then reuse this lightweight base for every later batch instead of re-picking fields off the full ~22-field object on every batch.
    const baseProducts: AmplifiedProduct[] = products.map(
      ({
        id,
        title,
        category,
        price,
        stock,
        thumbnail,
        images,
        discountPercentage,
        rating,
        brand,
        sku,
        shippingInformation,
      }) => ({
        id,
        title,
        category,
        price,
        stock,
        thumbnail,
        images,
        discountPercentage,
        rating,
        brand,
        sku,
        logisticStatus: deriveLogisticStatus(stock, shippingInformation),
      }),
    );

    // Status depends only on stock + shipping speed, neither of which changes across replicated batches of the same base product; reuse base.logisticStatus instead of recomputing it for every other batch.
    const amplifiedProducts: AmplifiedProduct[] = [...baseProducts];
    for (let batch = 1; batch < AMPLIFICATION_BATCHES; batch++) {
      for (const base of baseProducts) {
        const amplifiedId = base.id + batch * BASE_PRODUCT_COUNT;
        amplifiedProducts.push({
          ...base,
          id: amplifiedId,
          title: `${base.title} (Batch ${batch + 1})`,
        });
      }
    }
    return amplifiedProducts;
  },
);

// Category filter options for the Toolbar: distinct slugs, alphabetical. Deliberately not `lib/server/dal/dashboard.ts`'s getCategories(): that one aggregates stockValue/share/productCount and truncates to a top slice by value, neither of which a filter dropdown needs.
export const getInventoryCategories = cache(async (): Promise<string[]> => {
  const { products } = await apiFetch<{
    products: Pick<DummyProduct, "category">[];
  }>(`/products?limit=${BASE_PRODUCT_COUNT}&select=category`);

  return [...new Set(products.map((product) => product.category))].sort();
});
