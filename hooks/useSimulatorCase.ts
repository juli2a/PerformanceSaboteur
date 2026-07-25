import { useSimControlStore } from "@/store/simulator-control";
import type { CaseKey } from "@/types/simulator";

// Typed selector hook, prevents components from subscribing to the whole store.
export function useSimulatorCase(key: CaseKey): boolean {
  return useSimControlStore((state) => state.toggles[key]);
}
