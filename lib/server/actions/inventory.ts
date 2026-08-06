"use server";

import { apiFetch } from "@/lib/server/fetcher";
import { deriveRealProductId } from "@/lib/server/dal/inventory";
import type { LogisticStatus } from "@/types/inventory";

// Bulk logistic status update, called from BulkActions (a Client Component). Sends a real PATCH per product to DummyJSON (mapped back to its real id); DummyJSON doesn't persist writes, so the API simply echoes the product back without actually applying the change, which is exactly the "no-op API" the demo needs without faking the network call itself. The visible status change comes from the client applying inventory-status's optimistic overlay alongside this call, not from re-fetching.
export async function updateLogisticStatus(
  productIds: number[],
  status: LogisticStatus,
): Promise<{ ok: boolean }> {
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
