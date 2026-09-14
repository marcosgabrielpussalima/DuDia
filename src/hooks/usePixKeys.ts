import { useEffect, useSyncExternalStore } from "react";
import { pixKeysStore } from "@/src/lib/storage/pixKeys";

export function usePixKeys() {
  const snapshot = useSyncExternalStore(pixKeysStore.subscribe, pixKeysStore.getSnapshot, pixKeysStore.getSnapshot);
  useEffect(() => { void pixKeysStore.init(); }, []);
  return snapshot;
}
