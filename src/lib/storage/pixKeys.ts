import { createPixKeyStore } from "@/src/lib/domain/pixKeys";
import { storageGetStrict, storageSet } from "@/src/lib/storage/storage";

const KEY = "feira:pixKeys";

export const pixKeysStore = createPixKeyStore({
  read: () => storageGetStrict<unknown>(KEY, []),
  write: (keys) => storageSet(KEY, keys),
});
