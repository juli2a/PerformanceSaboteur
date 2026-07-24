// Shared data types for Inventory Control page

// Single source of truth for the logistic statuses: Bulk Actions' status picker and the mobile status-change sheet both iterate this array instead of repeating the literal list.
export const LOGISTIC_STATUSES = [
  "In Stock",
  "To Order",
  "Ordered",
  "In Transit",
  "Out of Stock",
] as const;

export type LogisticStatus = (typeof LOGISTIC_STATUSES)[number];

export interface BaseProduct {
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
}

export interface AmplifiedProduct extends BaseProduct {
  sku: string;
  logisticStatus: LogisticStatus;
}
