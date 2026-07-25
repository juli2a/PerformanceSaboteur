import { create } from "zustand";

import type { LogisticStatus } from "@/types/inventory";

// Optimistic status changes applied by Bulk Actions: DummyJSON doesn't persist PATCH writes, so the server response can't reflect the change. This map lets rows show the new status immediately without re-hosting the full product array on the client just to mutate a few entries.
interface InventoryStatusState {
  statuses: Map<number, LogisticStatus>;
  setStatuses: (ids: number[], status: LogisticStatus) => void;
}

export const useInventoryStatusStore = create<InventoryStatusState>((set) => ({
  statuses: new Map(),
  setStatuses: (ids, status) =>
    set((state) => {
      const next = new Map(state.statuses);
      for (const id of ids) next.set(id, status);
      return { statuses: next };
    }),
}));
