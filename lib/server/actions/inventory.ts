"use server";

import { apiFetch } from "@/lib/server/fetcher";
import {
  deriveRealProductId,
  TOTAL_PRODUCT_COUNT,
} from "@/lib/server/dal/inventory";
import { LOGISTIC_STATUSES, type LogisticStatus } from "@/types/inventory";

// Bulk logistic status update, called from BulkActions (a Client Component). Sends a real PATCH per product to DummyJSON (mapped back to its real id); DummyJSON doesn't persist writes, so the API simply echoes the product back without actually applying the change, which is exactly the "no-op API" the demo needs without faking the network call itself. The visible status change comes from the client applying inventory-status's optimistic overlay alongside this call, not from re-fetching.
//
// productIds/status are only typed at the call site, not at runtime: a Server Action compiles to a real POST endpoint, so a caller that skips the UI entirely can send anything here. Validate both before the Promise.all fan-out below, since an unbounded productIds array would otherwise turn one request into an unbounded number of concurrent PATCH calls.
export async function updateLogisticStatus(
  productIds: number[],
  status: LogisticStatus,
): Promise<{ ok: boolean }> {
  if (!LOGISTIC_STATUSES.includes(status)) {
    throw new Error(`Invalid logistic status: ${status}`);
  }
  if (
    !Array.isArray(productIds) ||
    productIds.length === 0 ||
    productIds.length > TOTAL_PRODUCT_COUNT ||
    !productIds.every((id) => Number.isInteger(id))
  ) {
    throw new Error("Invalid productIds");
  }

  await Promise.all(
    productIds.map((amplifiedId) =>
      apiFetch<unknown>(`/products/${deriveRealProductId(amplifiedId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logisticStatus: status }),
      }),
    ),
  );

  return { ok: true };
}
